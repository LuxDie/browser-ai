<script setup lang="ts">
import type { SupportedLanguageCode } from '@/entrypoints/background';
import { getLanguageKey } from '@/entrypoints/background/languages';

// Props
defineProps<{
  targetLanguage: SupportedLanguageCode;
  summarize: boolean;
  availableLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:targetLanguage': [value: SupportedLanguageCode];
  'update:summarize': [value: boolean];
  process: [];
}>();

// Funciones de manejo de eventos
const handleTargetLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:targetLanguage', target.value as SupportedLanguageCode);
};

const handleSummarizeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:summarize', target.checked);
};

const handleProcess = () => {
  emit('process');
};
</script>

<template>
  <div class="flex gap-2 items-end">
    <div class="flex-1">
      <label for="summarize-checkbox" class="block text-sm font-medium text-gray-700 mb-2">
        {{ browser.i18n.getMessage('optionsLabel') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="summarize-checkbox"
          :checked="summarize"
          @change="handleSummarizeChange"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        >
        <label for="summarize-checkbox" class="text-sm text-gray-700">
          {{ browser.i18n.getMessage('summarizeLabel') }}
        </label>
      </div>
    </div>

    <div class="flex-1">
      <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
        {{ browser.i18n.getMessage('targetLanguageLabel') }}
      </label>
      <select
        id="target-language"
        :value="targetLanguage"
        @change="handleTargetLanguageChange"
        class="input-field"
      >
        <option
          v-for="lang in availableLanguages"
          :key="lang"
          :value="lang"
        >
          {{ getLanguageKey(lang) }}
        </option>
      </select>
    </div>

    <button
      id="process-button"
      @click="handleProcess"
      :disabled="!canProcess || isLoading"
      class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="isLoading" class="loading-spinner mr-2"></span>
      {{ isLoading ? 'Procesando...' : 'Procesar' }}
    </button>
  </div>
</template>