<script setup lang="ts">
import { computed } from 'vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import SummarizeOption from './SummarizeOption.vue';
import LanguageSelector from './LanguageSelector.vue';

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
    <LanguageSelector
      :model-value="targetLanguage"
      :available-languages="availableLanguages"
      @update:model-value="emit('update:targetLanguage', $event)"
    />
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
