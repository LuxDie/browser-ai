<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const props = defineProps<{
  sourceLanguage: SupportedLanguageCode;
}>();

const languageService = LanguageService.getInstance();
const languageName = computed(() => {
  return languageService.getLanguageKey(props.sourceLanguage);
});

</script>

<template>
  <div v-if="sourceLanguage">
    <v-alert
      id="detected-language-container"
      :text="t('detectedLanguage', languageName)"
      type="info"
      variant="tonal"
    />
  </div>
</template>
