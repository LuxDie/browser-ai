<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const targetLanguage = defineModel<SupportedLanguageCode>('targetLanguage');
const summarize = defineModel<boolean>('summarize');

const props = defineProps<{
  supportedLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

const emit = defineEmits<{
  'process': [];
}>();

const buttonText = computed(() => {
  return props.isLoading
    ? t('processingButton')
    : t('processButton');
});

const isButtonDisabled = computed(() => {
  return props.isLoading || !props.canProcess;
});
</script>

<template>
  <div class="flex gap-2 items-end">
    <div class="flex-1">
      <label for="summarize-checkbox" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('optionsLabel') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="summarize-checkbox"
          v-model="summarize"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        >
        <label for="summarize-checkbox" class="text-sm text-gray-700">{{ t('summarizeLabel') }}</label>
      </div>
    </div>
    <div class="flex-1">
      <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('targetLanguageLabel') }}
      </label>
      <select
        id="target-language"
        v-model="targetLanguage"
        class="input-field"
      >
        <option v-for="lang in supportedLanguages" :key="lang" :value="lang">
          {{ t(languageService.getLanguageKey(lang)) }}
        </option>
      </select>
    </div>
    <button
      id="process-button"
      class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="isButtonDisabled"
      @click="emit('process')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>
