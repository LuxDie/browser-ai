<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode,
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const modelValue = defineModel<SupportedLanguageCode>();

const props = defineProps<{
  supportedLanguages: SupportedLanguageCode[];
}>();

const languageItems = computed(() => {
  return props.supportedLanguages.map((lang) => {
    return {
      value: lang,
      title: t(languageService.getLanguageKey(lang)),
    };
  });
});
</script>

<template>
  <v-select
    v-model="modelValue"
    :label="t('targetLanguageLabel')"
    :items="languageItems"
    class="flex-1"
  />
</template>
