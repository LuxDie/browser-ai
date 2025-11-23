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
  <div class="flex gap-2 items-end">
    <SummarizeOption v-model="summarize" />
    <LanguageSelector
      v-model="targetLanguage"
      :supported-languages="supportedLanguages"
    />
    <button
      id="process-button" data-testid="process-button"
      class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="!canProcess"
      @click="emit('process')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>
