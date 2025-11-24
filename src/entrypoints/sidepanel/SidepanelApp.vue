<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { type SupportedLanguageCode, LanguageService } from '@/entrypoints/background/language/language.service';
import AppHeader from '@/components/AppHeader.vue';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import ToolSelector, { type SelectedTools } from '@/components/ToolSelector.vue';
import OutputArea from '@/components/OutputArea.vue';

const AIService = getAIService();
const languageService = LanguageService.getInstance();
const t = browser.i18n.getMessage;

const modelStatus = ref<AIModelStatus | null>(null);
const text = ref('');
const availableLanguages = ref<SupportedLanguageCode[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const apiAvailable = ref(true);

const finalResult = ref('');
const toolSelectorRef = ref<InstanceType<typeof ToolSelector> | null>(null);

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
    
    // Handle automatic tool selection and processing
    if (message.data.action && toolSelectorRef.value) {
      toolSelectorRef.value.resetTools();
      
      const action = message.data.action;
      if (action === 'translate') {
        toolSelectorRef.value.selectTool('translate', true);
      } else if (action === 'summarize') {
        toolSelectorRef.value.selectTool('summarize', true);
      } else if (action === 'rewrite') {
        toolSelectorRef.value.selectTool('rewrite', true);
      } else if (action === 'proofread') {
        toolSelectorRef.value.selectTool('proofread', true);
      }

      // Wait for next tick to ensure state is updated if needed, though reactive state should be immediate
      // Trigger processing with the updated tools
      await processTools(toolSelectorRef.value.selectedTools);
    }
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
  finalResult.value = '';
  
  // Cancel previous request if any
  abortController.abort();
  abortController = new AbortController();
  
  // Reset service cancellation state
  AIService.cancelProcessing();

  let currentText = text.value;

  try {
    // 1. Proofread
    if (tools.proofread) {
      currentText = await AIService.proofread(currentText);
    }

    // 2. Rewrite
    if (tools.rewrite) {
      currentText = await AIService.rewrite(currentText);
    }

    // 3. Writer
    if (tools.write) {
      currentText = await AIService.write(currentText);
    }

    // 4. Prompt
    if (tools.prompt) {
      const fullPrompt = `${tools.promptText}\n\nContext:\n${currentText}`;
      currentText = await AIService.prompt(fullPrompt);
    }

    // 5. Summarize / Translate
    if (tools.summarize || tools.translate) {
      const isTranslation = tools.translate;
      const isSummarization = tools.summarize;
      
      const targetLang = isTranslation ? tools.targetLanguage : sourceLanguage.value;

      currentText = await AIService.processText(
        currentText,
        {
          sourceLanguage: sourceLanguage.value,
          targetLanguage: targetLang,
          summarize: isSummarization
        }
      );
    }

    finalResult.value = currentText;

  } catch (e: any) {
    if (e.name !== 'AbortError') {
      error.value = e.message || 'An unknown error occurred.';
    }
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  AIService.cancelProcessing();
  isLoading.value = false;
  error.value = 'Cancelled by user';
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
          ref="toolSelectorRef"
          :available-languages="availableLanguages"
          :is-loading="isLoading"
          :can-process="!!text"
          @process="processTools"
        />

        <v-alert v-if="error" type="error" variant="tonal">
          {{ error }}
        </v-alert>

        <OutputArea v-if="finalResult" :result="finalResult" />
      </v-container>
    </v-main>
  </v-app>
</template>
