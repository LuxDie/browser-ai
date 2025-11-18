<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { type SupportedLanguageCode, LanguageService } from '@/entrypoints/background/language/language.service';

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
  availableLanguages.value = [...languageService.getSupportedLanguages()];

  const browserLang = languageService.getBrowserLanguage();
  targetLanguage.value = languageService.isLanguageSupported(browserLang)
    ? browserLang
    : availableLanguages.value[0]!;

  onMessage('modelStatusUpdate', (message) => {
    if (message.data.state === 'downloading') {
      modelStatus.value = message.data;
    } else {
      modelStatus.value = null;
    }
  });

  onMessage('selectedText', async (message) => {
    text.value = message.data.text;
    summarize.value = message.data.summarize ?? false;
    warning.value = null;
    error.value = null;
    
    // Detectar idioma primero
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
    if (e instanceof Error && e.name !== 'AbortError') {
      const errorMessage = e.message;
      error.value = `${t('processingError')}\n${errorMessage}`;
    }
  } finally {
    isLoading.value = false;
  }
};

watch(text, async (newText) => {
  AIService.cancelProcessing();
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
    if (e instanceof Error && e.name !== 'AbortError') {
      error.value = t('languageDetectionError');
    }
  }
});

watch(targetLanguage, () => {
  AIService.cancelProcessing();
  isLoading.value = false; // Restablecer estado de carga cuando cambia el idioma de destino
  modelStatus.value = null; // Restablecer estado del modelo cuando cambia el idioma de destino
  warning.value = null;
});

watch(summarize, () => {
  AIService.cancelProcessing();
  isLoading.value = false; // Restablecer estado de carga cuando cambia resumir
  warning.value = null;
});

const handleCancel = () => {
  AIService.cancelProcessing();
  modelStatus.value = null;
};

</script>

<template>
<<<<<<< HEAD
  <div class="p-4 flex flex-col gap-4">
    <AppHeader :api-available="apiAvailable" />
=======
  <v-app>
    <v-main>
      <v-container>
        <v-app-bar density="compact" flat>
          <v-toolbar-title>Browser AI</v-toolbar-title>
        </v-app-bar>
>>>>>>> af4e7ee (feat: migrate ProcessControls.vue to Vue 3 Composition API)

        <ModelDownloadCard v-if="modelStatus" :status="modelStatus" :can-cancel="true" @cancel="handleCancel" />

<<<<<<< HEAD
    <InputArea
      v-model="text"
      :source-language="sourceLanguage"
    />

    <div v-if="warning" id="process-warning-container" class="text-yellow-800 bg-yellow-100 p-2 rounded-md">
      {{ warning }}
    </div>

    <ProcessControls
      v-model:targetLanguage="targetLanguage"
      v-model:summarize="summarize"
      :available-languages="availableLanguages"
      :is-loading="isLoading"
      :can-process="canProcess"
      @process="processText"
    />
=======
        <v-row>
          <v-col cols="12">
            <v-textarea
              id="input-text"
              label="Text to process"
              v-model="text"
              rows="5"
            ></v-textarea>
            <div v-if="sourceLanguage">
              Detected Language: {{ getLanguageKey(sourceLanguage) }}
            </div>
          </v-col>
        </v-row>

        <ProcessControls
          v-model:targetLanguage="targetLanguage"
          v-model:summarize="summarize"
          :available-languages="availableLanguages"
          :is-loading="isLoading"
          :can-process="!!sourceLanguage"
          @process="processText"
        />
>>>>>>> af4e7ee (feat: migrate ProcessControls.vue to Vue 3 Composition API)

        <v-alert v-if="error" type="error" class="my-4">
          {{ error }}
        </v-alert>

<<<<<<< HEAD
    <OutputArea :translated-text="translatedText" />
  </div>
=======
        <v-row v-if="translatedText">
          <v-col cols="12">
            <v-textarea
              label="Result"
              :model-value="translatedText"
              rows="5"
              readonly
            ></v-textarea>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
>>>>>>> af4e7ee (feat: migrate ProcessControls.vue to Vue 3 Composition API)
</template>
