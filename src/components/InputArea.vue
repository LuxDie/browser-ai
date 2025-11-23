<script setup lang="ts">
import {
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const modelValue = defineModel<string>();

defineProps<{
  sourceLanguage: SupportedLanguageCode | null;
}>();
</script>

<template>
  <v-textarea
    v-model="modelValue"
    :label="t('inputLabel')"
    rows="5"
    variant="outlined"
    clearable
  />
  <DetectedLanguage :source-language="sourceLanguage" />
</template>
