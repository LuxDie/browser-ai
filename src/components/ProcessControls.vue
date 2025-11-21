<script setup lang="ts">
import { computed } from 'vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import { LanguageService } from '@/entrypoints/background/language/language.service';
import SummarizeOption from './SummarizeOption.vue';

const languageService = LanguageService.getInstance();

const props = defineProps<{
  targetLanguage: SupportedLanguageCode;
  summarize: boolean;
  availableLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

const emit = defineEmits<{
  'update:targetLanguage': [value: SupportedLanguageCode];
  'update:summarize': [value: boolean];
  'process': [];
}>();

const buttonText = computed(() => {
  return props.isLoading
    ? browser.i18n.getMessage('processingButton')
    : browser.i18n.getMessage('processButton');
});

const isButtonDisabled = computed(() => {
  return props.isLoading || !props.canProcess;
});
</script>

<template>
  <div class="flex gap-2 items-end">
    <SummarizeOption
      :model-value="summarize"
      @update:model-value="emit('update:summarize', $event)"
    />
    <div class="flex-1">
      <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('targetLanguageLabel') }}
      </label>
      <select
        id="target-language"
        :value="targetLanguage"
        class="input-field"
        @change="emit('update:targetLanguage', ($event.target as HTMLSelectElement).value as SupportedLanguageCode)"
      >
        <option v-for="lang in availableLanguages" :key="lang" :value="lang">
          {{ languageService.getLanguageKey(lang) }}
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
