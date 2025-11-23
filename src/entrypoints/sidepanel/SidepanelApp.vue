<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { type SupportedLanguageCode, LanguageService } from '@/entrypoints/background/language/language.service';
import { t } from '@/utils/i18n';

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
const availableLanguages = ref<SupportedLanguageCode[]>([]);
const warning = ref<string | null>(null);
const apiAvailable = ref(true);

const canProcess = computed(() => {
  const hasText = text.value.trim().length > 0;
  const hasSourceLanguage = sourceLanguage.value !== null;
  const languagesAreSame = sourceLanguage.value?.toLowerCase() === targetLanguage.value.toLowerCase() && !summarize.value;
  const modelIsDownloading = modelStatus.value?.state === 'downloading';
  return hasText && hasSourceLanguage && (!languagesAreSame || summarize.value) && !isLoading.value && !modelIsDownloading;
});

onMounted(async () => {
  apiAvailable.value = await AIService.checkAPIAvailability();
  availableLanguages.value = [...languageService.getSupportedLanguages()];
  const browserLang = languageService.getBrowserLanguage();
  targetLanguage.value = languageService.isLanguageSupported(browserLang) ? browserLang : availableLanguages.value[0]!;

  onMessage('modelStatusUpdate', (message) => {
    modelStatus.value = message.data.state === 'downloading' ? message.data : null;
  });

  onMessage('selectedText', async (message) => {
    text.value = message.data.text;
    summarize.value = message.data.summarize ?? false;
    warning.value = null;
    error.value = null;
    if (text.value.trim().length >= 15) {
      try {
        AIService.cancelProcessing();
        const lang = await AIService.detectLanguage(text.value);
        if (languageService.isLanguageSupported(lang)) {
          sourceLanguage.value = lang;
          await processText();
        } else {
          sourceLanguage.value = null;
          error.value = t('detectedLanguageNotSupported', lang);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          error.value = t('languageDetectionError');
        }
      }
    }
  });

  void sendMessage('sidepanelReady');
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
  AIService.cancelProcessing();

  try {
    translatedText.value = await AIService.processText(text.value, {
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      summarize: summarize.value,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.name !== 'AbortError') {
      error.value = `${t('processingError')}\n${e.message}`;
    }
  } finally {
    isLoading.value = false;
  }
};

watch(text, async (newText) => {
  AIService.cancelProcessing();
  isLoading.value = false;
  modelStatus.value = null;
  warning.value = null;
  if (newText.trim().length < 15) {
    sourceLanguage.value = null;
    error.value = null;
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
    if (e instanceof Error && e.name !== 'AbortError') {
      error.value = t('languageDetectionError');
    }
  }
});

watch([targetLanguage, summarize], () => {
  AIService.cancelProcessing();
  isLoading.value = false;
  modelStatus.value = null;
  warning.value = null;
});

const handleCancel = () => {
  AIService.cancelProcessing();
  modelStatus.value = null;
};
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-app-bar density="compact" flat>
          <v-toolbar-title>Browser AI</v-toolbar-title>
        </v-app-bar>

        <ModelDownloadCard v-if="modelStatus" :status="modelStatus" :can-cancel="true" @cancel="handleCancel" />

        <v-row>
          <v-col cols="12">
            <v-textarea id="input-text" :label="t('textToProcessLabel')" v-model="text" rows="5"></v-textarea>
            <div v-if="sourceLanguage">
              {{ t('detectedLanguageLabel') }}: {{ languageService.getLanguageKey(sourceLanguage) }}
            </div>
          </v-col>
        </v-row>

        <v-alert v-if="warning" type="warning" class="my-4">
          {{ warning }}
        </v-alert>

        <ProcessControls
          v-model:targetLanguage="targetLanguage"
          v-model:summarize="summarize"
          :available-languages="availableLanguages"
          :is-loading="isLoading"
          :can-process="canProcess"
          @process="processText"
        />

        <v-alert v-if="error" type="error" class="my-4">
          {{ error }}
        </v-alert>

        <v-row v-if="translatedText">
          <v-col cols="12">
            <v-textarea :label="t('resultLabel')" :model-value="translatedText" rows="5" readonly></v-textarea>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
