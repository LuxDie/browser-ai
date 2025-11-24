<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { type SupportedLanguageCode, LanguageService } from '@/entrypoints/background/language/language.service';
import AppHeader from '@/components/AppHeader.vue';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import ToolSelector, { type SelectedTools } from '@/components/ToolSelector.vue';
import ResultCard from '@/components/ResultCard.vue';

const AIService = getAIService();
const languageService = LanguageService.getInstance();
const t = browser.i18n.getMessage;

const modelStatus = ref<AIModelStatus | null>(null);
const text = ref('');
const availableLanguages = ref<SupportedLanguageCode[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const apiAvailable = ref(true);

// Results state
interface ResultItem {
  id: string;
  title: string;
  content?: string;
  loading: boolean;
  error?: string;
}

const results = ref<ResultItem[]>([]);

// Use a ref for abort controller to be able to abort previous requests
let abortController = new AbortController();

onMounted(async () => {
  apiAvailable.value = await AIService.checkAPIAvailability();
  availableLanguages.value = [...languageService.getSupportedLanguages()];

  onMessage('modelStatusUpdate', (message) => {
    if (message.data.state === 'downloading') {
      modelStatus.value = message.data;
    } else {
      modelStatus.value = null;
    }
  });

  onMessage('selectedText', async (message) => {
    text.value = message.data.text;
    // We could handle pre-selection here if needed
  });

  void sendMessage('sidepanelReady');
});

const sourceLanguage = ref<SupportedLanguageCode | null>(null);

const getLanguageLabel = (code: SupportedLanguageCode) => {
  try {
    const message = t(languageService.getLanguageKey(code));
    return message || code;
  } catch (e) {
    console.error('Error getting language label:', e);
    return code;
  }
};

const processTools = async (tools: SelectedTools) => {
  if (!text.value || !sourceLanguage.value) return;

  isLoading.value = true;
  error.value = null;
  results.value = [];
  
  // Cancel previous request if any
  abortController.abort();
  abortController = new AbortController();
  
  // Reset service cancellation state
  AIService.cancelProcessing();

  let currentText = text.value;

  try {
    // 1. Proofread
    if (tools.proofread) {
      const id = 'proofread';
      results.value.push({ id, title: 'Proofread', loading: true });
      try {
        const res = await AIService.proofread(currentText);
        updateResult(id, res);
        currentText = res;
      } catch (err: any) {
        handleStepError(id, err);
        throw err;
      }
    }

    // 2. Rewrite
    if (tools.rewrite) {
      const id = 'rewrite';
      results.value.push({ id, title: 'Rewrite', loading: true });
      try {
        const res = await AIService.rewrite(currentText);
        updateResult(id, res);
        currentText = res;
      } catch (err: any) {
        handleStepError(id, err);
        throw err;
      }
    }

    // 3. Writer
    if (tools.write) {
      const id = 'write';
      results.value.push({ id, title: 'Writer', loading: true });
      try {
        const res = await AIService.write(currentText);
        updateResult(id, res);
        currentText = res;
      } catch (err: any) {
        handleStepError(id, err);
        throw err;
      }
    }

    // 4. Prompt
    if (tools.prompt) {
      const id = 'prompt';
      results.value.push({ id, title: 'Prompt Result', loading: true });
      const fullPrompt = `${tools.promptText}\n\nContext:\n${currentText}`;
      try {
        const res = await AIService.prompt(fullPrompt);
        updateResult(id, res);
        currentText = res;
      } catch (err: any) {
        handleStepError(id, err);
        throw err;
      }
    }

    // 5. Summarize / Translate
    if (tools.summarize || tools.translate) {
      const isTranslation = tools.translate;
      const isSummarization = tools.summarize;
      
      let id = '';
      let title = '';
      
      if (isSummarization && isTranslation) {
        id = 'summarize-translate';
        title = `Summary & Translation (${getLanguageLabel(tools.targetLanguage)})`;
      } else if (isSummarization) {
        id = 'summarize';
        title = 'Summary';
      } else {
        id = 'translate';
        title = `Translation (${getLanguageLabel(tools.targetLanguage)})`;
      }

      results.value.push({ id, title, loading: true });
      
      const targetLang = isTranslation ? tools.targetLanguage : sourceLanguage.value;

      try {
        const res = await AIService.processText(
          currentText,
          {
            sourceLanguage: sourceLanguage.value,
            targetLanguage: targetLang,
            summarize: isSummarization
          }
        );
        updateResult(id, res);
        currentText = res;
      } catch (err: any) {
        handleStepError(id, err);
        throw err;
      }
    }

  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = e.message || 'An unknown error occurred.';
    }
  } finally {
    isLoading.value = false;
  }
};

const updateResult = (id: string, content: string) => {
  const item = results.value.find(r => r.id === id);
  if (item) {
    item.content = content;
    item.loading = false;
  }
};

const handleStepError = (id: string, err: any) => {
  const item = results.value.find(r => r.id === id);
  if (item) {
    item.error = err.message;
    item.loading = false;
  }
};

const handleCancel = () => {
  AIService.cancelProcessing();
  isLoading.value = false;
  results.value.forEach(r => {
    if (r.loading) {
      r.loading = false;
      r.error = 'Cancelled by user';
    }
  });
};

watch(text, async (newText) => {
  if (newText.trim().length < 15) {
    sourceLanguage.value = null;
    return;
  }
  try {
    const lang = await AIService.detectLanguage(newText);
    if (languageService.isLanguageSupported(lang)) {
      sourceLanguage.value = lang as SupportedLanguageCode;
    }
  } catch (e) {
    // Ignore detection errors
  }
});
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="d-flex flex-column ga-4">
        <AppHeader :api-available="apiAvailable" />

        <ModelDownloadCard v-if="modelStatus" :status="modelStatus" :can-cancel="true" @cancel="handleCancel" />

        <v-textarea
          id="input-text"
          :label="t('inputLabel')"
          v-model="text"
          rows="5"
          variant="outlined"
          hide-details="auto"
        ></v-textarea>
        <div v-if="sourceLanguage" class="text-caption text-medium-emphasis">
          Detected Language: {{ getLanguageLabel(sourceLanguage) }}
        </div>

        <ToolSelector
          :available-languages="availableLanguages"
          :is-loading="isLoading"
          :can-process="!!text"
          @process="processTools"
        />

        <v-alert v-if="error" type="error" variant="tonal">
          {{ error }}
        </v-alert>

        <div v-if="results.length > 0" class="d-flex flex-column ga-4">
          <ResultCard
            v-for="result in results"
            :key="result.id"
            :title="result.title"
            :content="result.content"
            :loading="result.loading"
            :error="result.error"
          />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>
