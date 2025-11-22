<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const targetLanguage = defineModel<SupportedLanguageCode>('targetLanguage');
const summarize = defineModel<boolean>('summarize');

const props = defineProps<{
  availableLanguages: SupportedLanguageCode[];
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

</script>

<template>
  <div class="flex gap-2 items-end">
    <SummarizeOption v-model="summarize" />
    <div class="flex-1">
      <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('targetLanguageLabel') }}
      </label>
      <select
        id="target-language"
        v-model="targetLanguage"
        class="input-field"
      >
        <option v-for="lang in availableLanguages" :key="lang" :value="lang">
          {{ languageService.getLanguageKey(lang) }}
        </option>
      </select>
    </div>
    <button
      id="process-button"
      class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="!canProcess"
      @click="emit('process')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>