<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import ModelDownloadCard from './components/ModelDownloadCard.vue';
import ProcessControls from './components/ProcessControls.vue';
import { DEFAULT_TARGET_LANGUAGE, type SupportedLanguageCode } from '@/entrypoints/background';
import { isLanguageSupported, getLanguageKey } from '@/entrypoints/background/languages';

const AIService = getAIService();

const modelStatus = ref<AIModelStatus | null>(null);
const text = ref('');
const translatedText = ref('');
const sourceLanguage = ref<SupportedLanguageCode | null>(null);
const targetLanguage = ref<SupportedLanguageCode>(DEFAULT_TARGET_LANGUAGE);
const isLoading = ref(false);
const error = ref<string | null>(null);
const summarize = ref(false);
const availableLanguages = ref<SupportedLanguageCode[]>([]);

let abortController = new AbortController();

onMounted(async () => {
  const langs = await sendMessage('getAvailableLanguages');
  if (langs) {
    availableLanguages.value = [...langs] as SupportedLanguageCode[];
  }

  const browserLang = await sendMessage('getBrowserLanguage');
  if (browserLang && isLanguageSupported(browserLang)) {
    targetLanguage.value = browserLang as SupportedLanguageCode;
  }

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
    await processText();
  });

  void sendMessage('sidepanelReady');
});

const processText = async () => {
  if (!sourceLanguage.value) return;

  isLoading.value = true;
  error.value = null;
  translatedText.value = '';
  abortController = new AbortController();

  try {
    const response = await AIService.processText(
      text.value,
      {
        sourceLanguage: sourceLanguage.value,
        targetLanguage: targetLanguage.value,
        summarize: summarize.value,
      },
      abortController.signal
    );
    translatedText.value = response;
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = e.message || 'An unknown error occurred.';
    }
  } finally {
    isLoading.value = false;
  }
};

watch(text, async (newText) => {
  abortController.abort();
  if (newText.trim().length < 15) {
    sourceLanguage.value = null;
    return;
  }
  try {
    abortController = new AbortController();
    const lang = await AIService.detectLanguage(newText, { signal: abortController.signal });
    if (isLanguageSupported(lang)) {
      sourceLanguage.value = lang as SupportedLanguageCode;
    } else {
      sourceLanguage.value = null;
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = 'Language detection failed.';
    }
  }
});

watch(targetLanguage, () => {
  abortController.abort();
});

watch(summarize, () => {
  abortController.abort();
});

const handleCancel = () => {
  abortController.abort();
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

        <v-alert v-if="error" type="error" class="my-4">
          {{ error }}
        </v-alert>

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
</template>
