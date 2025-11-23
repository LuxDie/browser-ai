<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode,
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const modelValue = defineModel<SupportedLanguageCode>();

defineProps<{
  supportedLanguages: SupportedLanguageCode[];
}>();
</script>

<template>
  <div class="flex-1">
    <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
      {{ t('targetLanguageLabel') }}
    </label>
    <select
      id="target-language"
      v-model="modelValue"
      class="input-field"
    >
      <option v-for="lang in supportedLanguages" :key="lang" :value="lang">
        {{ t(languageService.getLanguageKey(lang)) }}
      </option>
    </select>
  </div>
</template>
