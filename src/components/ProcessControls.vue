<script setup lang="ts">
import { computed } from 'vue';
import type {
  SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';

const targetLanguage = defineModel<SupportedLanguageCode>('targetLanguage');
const summarize = defineModel<boolean>('summarize');

const props = defineProps<{
  availableLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

const emit = defineEmits<{
  'process': [];
}>();

const buttonText = computed(() => {
  return props.isLoading
    ? t('processingButton')
    : t('processButton');
});

</script>

<template>
  <div class="d-flex ga-2 align-end">
    <SummarizeOption v-model="summarize" />
    <LanguageSelector
      v-model="targetLanguage"
      :available-languages="availableLanguages"
    />
    <v-btn
      id="process-button"
      class="px-6"
      :disabled="!canProcess"
      :loading="isLoading"
      @click="emit('process')"
    >
      {{ buttonText }}
    </v-btn>
  </div>
</template>
