<script setup lang="ts">
import {
  LanguageService,
  type SupportedLanguageCode,
} from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

const model = defineModel<SupportedLanguageCode>();

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
    v-model="model"
    :label="t('targetLanguageLabel')"
    :items="languageItems"
    class="flex-1"
    hide-details
    density="compact"
    data-testid="language-selector"
  />
</template>
