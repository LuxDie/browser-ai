<script setup lang="ts">
import { ref } from 'vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import { LanguageService } from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

defineProps<{
  availableLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

const emit = defineEmits<{
  (e: 'process', tools: SelectedTools): void;
}>();

export interface SelectedTools {
  translate: boolean;
  targetLanguage: SupportedLanguageCode;
  summarize: boolean;
  write: boolean;
  rewrite: boolean;
  proofread: boolean;
  prompt: boolean;
  promptText: string;
}

const selectedTools = ref<SelectedTools>({
  translate: false,
  targetLanguage: 'es' as SupportedLanguageCode,
  summarize: false,
  write: false,
  rewrite: false,
  proofread: false,
  prompt: false,
  promptText: ''
});

const handleProcess = () => {
  emit('process', selectedTools.value);
};

// Ensure at least one tool is selected to enable process button
const hasSelection = () => {
  return (
    selectedTools.value.translate ||
    selectedTools.value.summarize ||
    selectedTools.value.write ||
    selectedTools.value.rewrite ||
    selectedTools.value.proofread ||
    selectedTools.value.prompt
  );
};

const getLanguageLabel = (code: SupportedLanguageCode) => {
  try {
    const message = browser.i18n.getMessage(languageService.getLanguageKey(code));
    return message || code;
  } catch (e) {
    console.error('Error getting language label:', e);
    return code;
  }
};

const resetTools = () => {
  selectedTools.value = {
    translate: false,
    targetLanguage: selectedTools.value.targetLanguage, // Keep target language preference
    summarize: false,
    write: false,
    rewrite: false,
    proofread: false,
    prompt: false,
    promptText: ''
  };
};

type BooleanToolKeys = {
  [K in keyof SelectedTools]: SelectedTools[K] extends boolean ? K : never
}[keyof SelectedTools];

const selectTool = (tool: BooleanToolKeys, value: boolean = true) => {
  if (tool in selectedTools.value) {
    selectedTools.value[tool] = value;
  }
};

defineExpose({
  selectTool,
  resetTools,
  selectedTools
});
</script>

<template>
  <v-card variant="flat" class="pa-0">
    <v-card-text class="pa-0">
      <v-row dense>
        <!-- Translate -->
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-checkbox
              v-model="selectedTools.translate"
              label="Translate"
              hide-details
              density="compact"
              class="mr-2"
            ></v-checkbox>
            <v-select
              v-if="selectedTools.translate"
              v-model="selectedTools.targetLanguage"
              :items="availableLanguages"
              :item-title="getLanguageLabel"
              label="Target Language"
              density="compact"
              hide-details
              variant="outlined"
              class="flex-grow-1"
            ></v-select>
          </div>
        </v-col>

        <!-- Summarize -->
        <v-col cols="6">
          <v-checkbox
            v-model="selectedTools.summarize"
            label="Summarize"
            hide-details
            density="compact"
          ></v-checkbox>
        </v-col>

        <!-- Proofread -->
        <v-col cols="6">
          <v-checkbox
            v-model="selectedTools.proofread"
            label="Proofread"
            hide-details
            density="compact"
          ></v-checkbox>
        </v-col>

        <!-- Rewrite -->
        <v-col cols="6">
          <v-checkbox
            v-model="selectedTools.rewrite"
            label="Rewrite"
            hide-details
            density="compact"
          ></v-checkbox>
        </v-col>

        <!-- Writer -->
        <v-col cols="6">
          <v-checkbox
            v-model="selectedTools.write"
            label="Writer"
            hide-details
            density="compact"
          ></v-checkbox>
        </v-col>

        <!-- Prompt -->
        <v-col cols="12">
          <v-checkbox
            v-model="selectedTools.prompt"
            label="Custom Prompt"
            hide-details
            density="compact"
          ></v-checkbox>
          <v-textarea
            v-if="selectedTools.prompt"
            v-model="selectedTools.promptText"
            label="Enter your prompt"
            rows="2"
            variant="outlined"
            density="compact"
            hide-details
            class="mt-2"
          ></v-textarea>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions class="px-0 pt-4">
      <v-btn
        block
        color="primary"
        variant="flat"
        size="large"
        :loading="isLoading"
        :disabled="!canProcess || !hasSelection()"
        @click="handleProcess"
      >
        Process
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
