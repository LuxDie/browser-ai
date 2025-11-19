<script setup lang="ts">
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import { LanguageService } from '@/entrypoints/background/language/language.service';

const languageService = LanguageService.getInstance();

// Props
defineProps<{
  targetLanguage: SupportedLanguageCode;
  summarize: boolean;
  availableLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:targetLanguage': [value: SupportedLanguageCode];
  'update:summarize': [value: boolean];
  process: [];
}>();

const handleProcess = () => {
  emit('process');
};

const getLanguageName = (code: SupportedLanguageCode) => {
  return browser.i18n.getMessage(languageService.getLanguageKey(code));
};
</script>

<template>
  <v-row align="center" dense>
    <v-col cols="auto">
      <v-checkbox
        :label="browser.i18n.getMessage('summarizeLabel')"
        :model-value="summarize"
        @update:modelValue="(value: boolean | null) => emit('update:summarize', !!value)"
        hide-details
        density="compact"
      ></v-checkbox>
    </v-col>
    <v-col>
      <v-select
        :label="browser.i18n.getMessage('targetLanguageLabel')"
        :model-value="targetLanguage"
        :items="availableLanguages"
        :item-title="getLanguageName"
        item-value="lang"
        @update:modelValue="(value: SupportedLanguageCode) => emit('update:targetLanguage', value)"
        hide-details
        density="compact"
      ></v-select>
    </v-col>
    <v-col cols="auto">
      <v-btn
        @click="handleProcess"
        :disabled="!canProcess || isLoading"
        :loading="isLoading"
        color="primary"
      >
        Procesar
      </v-btn>
    </v-col>
  </v-row>
</template>