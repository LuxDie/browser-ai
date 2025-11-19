<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import ModelDownloadCard from './components/ModelDownloadCard.vue';
import ToolSelector, { type SelectedTools } from './components/ToolSelector.vue';
import ResultCard from './components/ResultCard.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import { LanguageService } from '@/entrypoints/background/language/language.service';

const AIService = getAIService();

const modelStatus = ref<AIModelStatus | null>(null);
const text = ref('');
const availableLanguages = ref<SupportedLanguageCode[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Results state
interface ResultItem {
  id: string;
  title: string;
  content?: string;
  loading: boolean;
  error?: string;
}

const results = ref<ResultItem[]>([]);

let abortController = new AbortController();

const languageService = LanguageService.getInstance();

onMounted(async () => {
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
    // If summarize was requested via context menu, we could pre-select it,
    // but for now we just populate the text.
  });

  void sendMessage('sidepanelReady');
});

const processTools = async (tools: SelectedTools) => {
  if (!text.value) return;

  isLoading.value = true;
  error.value = null;
  results.value = [];
  abortController = new AbortController();

  try {
    const promises: Promise<void>[] = [];

    // Translate
    if (tools.translate) {
      const id = 'translate';
      results.value.push({ id, title: `Translation (${getLanguageLabel(tools.targetLanguage)})`, loading: true });
      promises.push(
        AIService.processText(
          text.value,
          {
            sourceLanguage: sourceLanguage.value || 'en',
            targetLanguage: tools.targetLanguage,
            summarize: false
          }
        ).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    // Summarize
    if (tools.summarize) {
      const id = 'summarize';
      results.value.push({ id, title: 'Summary', loading: true });
      promises.push(
        AIService.processText(
          text.value,
          {
            sourceLanguage: sourceLanguage.value || 'en',
            targetLanguage: tools.targetLanguage, // Summarize uses target language for output if needed
            summarize: true
          }
        ).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    // Proofread
    if (tools.proofread) {
      const id = 'proofread';
      results.value.push({ id, title: 'Proofread', loading: true });
      promises.push(
        AIService.proofread(text.value).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    // Rewrite
    if (tools.rewrite) {
      const id = 'rewrite';
      results.value.push({ id, title: 'Rewrite', loading: true });
      promises.push(
        AIService.rewrite(text.value).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    // Writer
    if (tools.write) {
      const id = 'write';
      results.value.push({ id, title: 'Writer', loading: true });
      promises.push(
        AIService.write(text.value).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    // Prompt
    if (tools.prompt) {
      const id = 'prompt';
      results.value.push({ id, title: 'Prompt Result', loading: true });
      // For prompt, we might need to combine text + prompt or just use promptText
      // Assuming we send the user prompt + context text
      const fullPrompt = `${tools.promptText}\n\nContext:\n${text.value}`;
      promises.push(
        AIService.prompt(fullPrompt).then(res => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.content = res;
            item.loading = false;
          }
        }).catch(err => {
          const item = results.value.find(r => r.id === id);
          if (item) {
            item.error = err.message;
            item.loading = false;
          }
        })
      );
    }

    await Promise.all(promises);

  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = e.message || 'An unknown error occurred.';
    }
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  abortController.abort();
  isLoading.value = false;
  results.value.forEach(r => {
    if (r.loading) {
      r.loading = false;
      r.error = 'Cancelled by user';
    }
  });
};

// Language detection logic (simplified for now)
const sourceLanguage = ref<SupportedLanguageCode | null>(null);
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

const getLanguageLabel = (code: SupportedLanguageCode) => {
  try {
    const message = browser.i18n.getMessage(languageService.getLanguageKey(code));
    return message || code;
  } catch (e) {
    console.error('Error getting language label:', e);
    return code;
  }
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
              variant="outlined"
            ></v-textarea>
            <div v-if="sourceLanguage" class="text-caption text-medium-emphasis mb-2">
              Detected Language: {{ getLanguageLabel(sourceLanguage) }}
            </div>
          </v-col>
        </v-row>

        <ToolSelector
          :available-languages="availableLanguages"
          :is-loading="isLoading"
          :can-process="!!text"
          @process="processTools"
        />

        <v-alert v-if="error" type="error" class="my-4">
          {{ error }}
        </v-alert>

        <div v-if="results.length > 0" class="mt-4">
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

