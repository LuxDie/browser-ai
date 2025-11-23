<script setup lang="ts">
import type {
  SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';
import SummarizeOption from './SummarizeOption.vue';
import LanguageSelector from './LanguageSelector.vue';

const targetLanguage = defineModel<SupportedLanguageCode>(
  'targetLanguage', { required: true }
);
const summarize = defineModel<boolean>('summarize', { required: true });

const props = defineProps<{
  supportedLanguages: SupportedLanguageCode[];
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
      :supported-languages="supportedLanguages"
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
