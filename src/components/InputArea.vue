<script setup lang="ts">
import {
  type SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';
import DetectedLanguage from '@/components/DetectedLanguage.vue';

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
  <DetectedLanguage v-if="sourceLanguage" :source-language="sourceLanguage" />
</template>
