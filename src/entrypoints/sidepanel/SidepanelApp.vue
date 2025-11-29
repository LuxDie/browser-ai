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
const sourceLanguage = ref<SupportedLanguageCode | null>(null);
const targetLanguage = ref<SupportedLanguageCode>('es');
const isLoading = ref(false);
const error = ref<string | null>(null);
const summarize = ref(false);
const supportedLanguages = ref<SupportedLanguageCode[]>([]);

const warning = ref<string | null>(null);



const canProcess = computed(() => {
  const hasText = text.value.trim().length > 0;
  const hasSourceLanguage = sourceLanguage.value !== null;
  const languagesAreSame = sourceLanguage.value?.toLowerCase() === targetLanguage.value.toLowerCase() && !summarize.value;
  const modelIsDownloading = modelStatus.value?.state === 'downloading';
  return hasText && hasSourceLanguage && (!languagesAreSame || summarize.value) && !isLoading.value && !modelIsDownloading;
});

const apiAvailable = ref(true);

onMounted(async () => {
  apiAvailable.value = await AIService.checkAPIAvailability();
  supportedLanguages.value = [...languageService.getSupportedLanguages()];

  const browserLang = languageService.getBrowserLanguage();
  targetLanguage.value = languageService.isLanguageSupported(browserLang)
    ? browserLang
    : supportedLanguages.value[0]!;

  window.addEventListener('modelStatusUpdate', (event: Event) => {
    const customEvent = event as CustomEvent<AIModelStatus>;
    if (customEvent.detail.state === 'downloading') {
      modelStatus.value = customEvent.detail;
    } else {
      modelStatus.value = null;
    }
  });

  window.addEventListener('selectedText', async (event: Event) => {
    const customEvent = event as CustomEvent<{ text: string; summarize?: boolean }>;
    text.value = customEvent.detail.text;
    summarize.value = customEvent.detail.summarize ?? false;
    warning.value = null;
    error.value = null;
    
    // Detectar idioma primero
    if (text.value.trim().length >= 15) {
      try {
        const lang = await AIService.detectLanguage(text.value);
        if (languageService.isLanguageSupported(lang)) {
          sourceLanguage.value = lang;
          await processText();
        } else {
          sourceLanguage.value = null;
          error.value = t('detectedLanguageNotSupported', lang);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          error.value = t('languageDetectionError');
        }
      }
    }
  });

  window.dispatchEvent(new CustomEvent('sidepanelReady'));
});

const processText = async () => {
  if (!sourceLanguage.value) return;

  if (sourceLanguage.value === targetLanguage.value && !summarize.value) {
    warning.value = t('sameLanguageWarning');
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
      const errorMessage = e.message;
      error.value = `${t('processingError')}\n${errorMessage}`;
    }
  } finally {
    isLoading.value = false;
  }
};

watch(text, async (newText) => {

  isLoading.value = false; // Restablecer estado de carga cuando cambia el texto
  modelStatus.value = null; // Restablecer estado del modelo cuando cambia el texto
  warning.value = null;
  if (newText.trim().length < 15) {
    sourceLanguage.value = null;
    error.value = null; // Limpiar error cuando el texto es demasiado corto
    return;
  }
  try {
    const lang = await AIService.detectLanguage(newText);
    if (languageService.isLanguageSupported(lang)) {
      sourceLanguage.value = lang;
      error.value = null;
    } else {
      sourceLanguage.value = null;
      error.value = t('detectedLanguageNotSupported', lang);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = t('languageDetectionError');
    }
  }
});

watch(targetLanguage, () => {

  isLoading.value = false; // Restablecer estado de carga cuando cambia el idioma de destino
  modelStatus.value = null; // Restablecer estado del modelo cuando cambia el idioma de destino
  warning.value = null;
});

watch(summarize, () => {

  isLoading.value = false; // Restablecer estado de carga cuando cambia resumir
  warning.value = null;
});

</script>

<template>
  <div data-testid="sidepanel-app-container" class="p-4 flex flex-col gap-4">
    <AppHeader :api-available="apiAvailable" />

    <ModelDownloadCard v-if="modelStatus" :status="modelStatus" />

    <InputArea
      v-model="text"
      :source-language="sourceLanguage"
    />

    <div v-if="warning" id="process-warning-container" data-testid="warning-container" class="text-yellow-800 bg-yellow-100 p-2 rounded-md">
      {{ warning }}
    </div>

    <ProcessControls
      v-model:targetLanguage="targetLanguage"
      v-model:summarize="summarize"
      :supported-languages="supportedLanguages"
      :is-loading="isLoading"
      :can-process="canProcess"
      @process="processText"
    />

    <div v-if="error" data-testid="error-container" class="text-red-500 bg-red-100 p-2 rounded-md">
      {{ error }}
    </div>

    <OutputArea :translated-text="translatedText" />
  </div>
</template>