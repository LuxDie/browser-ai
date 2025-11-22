<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const modelValue = defineModel<string>();

defineProps<{
  sourceLanguage: SupportedLanguageCode | null;
}>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label for="input-text">{{ t('inputLabel') }}</label>
    <textarea
      id="input-text"
      v-model="modelValue"
      class="border p-2 rounded-md"
      rows="5"
    ></textarea>
    <div v-if="sourceLanguage">
      {{ t('detectedLanguage', t(languageService.getLanguageKey(sourceLanguage))) }}
    </div>
  </div>
</template>
