<script setup lang="ts">
import { LanguageService, type SupportedLanguageCode } from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

defineProps<{
  modelValue: SupportedLanguageCode;
  availableLanguages: SupportedLanguageCode[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SupportedLanguageCode];
}>();
</script>

<template>
  <div class="flex-1">
    <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
      {{ browser.i18n.getMessage('targetLanguageLabel') }}
    </label>
    <select
      id="target-language"
      :value="modelValue"
      class="input-field"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as SupportedLanguageCode)"
    >
      <option v-for="lang in availableLanguages" :key="lang" :value="lang">
        {{ languageService.getLanguageKey(lang) }}
      </option>
    </select>
  </div>
</template>
