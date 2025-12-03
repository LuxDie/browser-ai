<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { type SupportedLanguageCode, LanguageService } from '@/entrypoints/background/language/language.service';
import AppHeader from '@/components/AppHeader.vue';
import InputArea from '@/components/InputArea.vue';
import ProcessControls from '@/components/ProcessControls.vue';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import OutputArea from '@/components/OutputArea.vue';

const AIService = getAIService();
const languageService = LanguageService.getInstance();

const modelStatus = ref<AIModelStatus | null>(null);
const text = ref('');
const translatedText = ref('');
const detectedLanguage = ref<string | null>(null);
const sourceLanguage = ref<SupportedLanguageCode | null>(null);
const targetLanguage = ref<SupportedLanguageCode>('es');
const isLoading = ref(false);
const error = ref<{ type: string; error: Error } | null>(null);
const summarize = ref(false);
const supportedLanguages = ref<SupportedLanguageCode[]>([]);

const displayError = computed(() => {
  if (!error.value || error.value.error.name === 'AbortError') return null;
  return {
    type: error.value.type,
    message: error.value.error.message
  };
});

const unsupportedLanguage = computed(() => {
  return !!detectedLanguage.value && !languageService.isLanguageSupported(detectedLanguage.value);
});

const insufficientText = computed(() => {
  return !!text.value && text.value.trim().length < minDetectLength;
});

const sameLanguage = computed(() => {
  return sourceLanguage.value === targetLanguage.value && !summarize.value;
});

const canProcess = computed(() => {
  const hasText = text.value.trim().length > 0;
  const hasSourceLanguage = sourceLanguage.value !== null;
  const languagesAreSame = sourceLanguage.value?.toLowerCase() === targetLanguage.value.toLowerCase() && !summarize.value;
  const modelIsDownloading = modelStatus.value?.state === 'downloading';
  return hasText && hasSourceLanguage && (!languagesAreSame || summarize.value) && !isLoading.value && !modelIsDownloading;
});

const apiAvailable = ref(true);
const minDetectLength = 15;
const handleModelStatusUpdate = (event: Event) => {
  const customEvent = event as CustomEvent<AIModelStatus>;
  if (customEvent.detail.state === 'downloading') {
    modelStatus.value = customEvent.detail;
  } else {
    modelStatus.value = null;
  }
};

const handleSelectedText = (event: Event) => {
  void (async () => {
    const customEvent = event as CustomEvent<{ text: string; summarize?: boolean }>;
    text.value = customEvent.detail.text;
    summarize.value = customEvent.detail.summarize ?? false;

    // Esperar a que los watchers finalicen antes de proceder
    await nextTick();
    if (canProcess.value) {
      await processText();
    }
  })();
};

onMounted(async () => {
  apiAvailable.value = await AIService.checkAPIAvailability();
  supportedLanguages.value = [...languageService.getSupportedLanguages()];

  const browserLang = languageService.getBrowserLanguage();
  targetLanguage.value = languageService.isLanguageSupported(browserLang)
    ? browserLang
    : supportedLanguages.value[0]!;

  window.addEventListener('modelStatusUpdate', handleModelStatusUpdate);
  window.addEventListener('selectedText', handleSelectedText);

  window.dispatchEvent(new CustomEvent('appMounted'));
});

onUnmounted(() => {
  window.removeEventListener('modelStatusUpdate', handleModelStatusUpdate);
  window.removeEventListener('selectedText', handleSelectedText);
});

const processText = async () => {
  if (!sourceLanguage.value || sameLanguage.value) {
    console.warn(t('processingAborted'));
    return;
  }

  isLoading.value = true;
  error.value = null;
  translatedText.value = '';
  try {
    const response = await AIService.processText(
      text.value,
      {
        sourceLanguage: sourceLanguage.value,
        targetLanguage: targetLanguage.value,
        summarize: summarize.value,
      }
    );
    translatedText.value = response;
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = {
        type: t('processingError'),
        error: e
      };
    } else {
      console.warn(`${t('nonStandardError')}:`, e);
    }
  } finally {
    isLoading.value = false;
  }
};

watch(text, async (newText) => {
  resetSharedState();
  if (newText.length === 0) return;
  if (newText.trim().length < minDetectLength) {
    sourceLanguage.value = detectedLanguage.value = null;
    return;
  }
  try {
    detectedLanguage.value = await AIService.detectLanguage(newText);
    if (languageService.isLanguageSupported(detectedLanguage.value)) {
      sourceLanguage.value = detectedLanguage.value;
      error.value = null;
    } else {
      sourceLanguage.value = null;
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = {
        type: t('languageDetectionError'),
        error: e
      };
    } else {
      console.warn(`${t('nonStandardError')}:`, e);
    }
  }
});

watch(targetLanguage, () => {
  resetSharedState();
});

watch(summarize, () => {
  resetSharedState();
});

const handleCancel = () => {
  void AIService.cancelProcessing();
  modelStatus.value = null;
};

const resetSharedState = () => {
  void AIService.cancelProcessing();
  isLoading.value = false;
  modelStatus.value = null;
  error.value = null;
};

const dCardParams = computed(() => {
  if (!modelStatus.value) throw new Error('No model status');
  return {
    source: sourceLanguage.value!,
    target: targetLanguage.value,
  };
});

</script>

<template>
  <div
    class="pa-4 d-flex flex-column ga-4"
    data-testid="sidepanel-app-container"
  >
    <AppHeader :api-available="apiAvailable" />

    <InputArea
      v-model="text"
      :language="detectedLanguage"
    />

    <ModelDownloadCard
      v-if="modelStatus"
      :status="modelStatus"
      :params="dCardParams"
      @cancel="handleCancel"
    />

    <v-alert
      v-if="insufficientText"
      data-testid="insufficient-text-message"
    >
      {{ t('insufficientTextForDetection') }}
    </v-alert>

    <v-alert
      v-if="sameLanguage"
      type="warning"
      data-testid="same-language-message"
    >
      {{ t('sameLanguageWarning') }}
    </v-alert>

    <v-alert
      v-if="unsupportedLanguage"
      type="error"
      data-testid="unsupported-language-message"
    >
      {{ t('detectedLanguageNotSupported', detectedLanguage!) }}
    </v-alert>

    <ProcessControls
      v-model:target-language="targetLanguage"
      v-model:summarize="summarize"
      :supported-languages="supportedLanguages"
      :is-loading="isLoading"
      :can-process="canProcess"
      @process="processText"
    />

    <v-alert
      v-if="displayError"
      data-testid="error-container"
      type="error"
    >
      <p>{{ displayError.type }}</p>
      <p>{{ displayError.message }}</p>
    </v-alert>

    <OutputArea
      v-if="translatedText"
      v-model="translatedText"
    />
  </div>
</template>
