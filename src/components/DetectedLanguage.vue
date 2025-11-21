<script setup lang="ts">
import { LanguageService, type SupportedLanguageCode } from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

defineProps<{
  sourceLanguage: SupportedLanguageCode | null;
}>();
</script>

<template>
  <div v-if="sourceLanguage">
    {{ browser.i18n.getMessage('detectedLanguage', [languageService.getLanguageKey(sourceLanguage)]) }}
  </div>
</template>
