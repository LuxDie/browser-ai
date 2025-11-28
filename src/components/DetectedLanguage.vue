<script setup lang="ts">
import {
  LanguageService,
} from '@/entrypoints/background/language/language.service';

const props = defineProps<{
  language: string | null;
}>();

const languageService = LanguageService.getInstance();

const languageMessage = computed(() => {
  if (!props.language) return '';
  const languageName = languageService.isLanguageSupported(props.language)
    ? t(languageService.getLanguageKey(props.language))
    : props.language;
  return t('detectedLanguage', languageName);
});
</script>

<template>
  <v-fade-transition>
    <div
      v-if="language"
      class="d-flex align-center"
    >
      <v-tooltip
        :text="languageMessage"
        data-testid="detected-language-message"
      >
        <template #activator="{ props: ttProps }">
          <v-chip
            v-bind="ttProps"
            size="x-small"
            color="primary"
            variant="tonal"
            data-testid="detected-language-code"
          >
            {{ language }}
          </v-chip>
        </template>
      </v-tooltip>
    </div>
  </v-fade-transition>
</template>
