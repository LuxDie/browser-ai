<script setup lang="ts">
import type {
  SupportedLanguageCode
} from '@/entrypoints/background/language/language.service';
import LanguageSelector from './LanguageSelector.vue';

const targetLanguage = defineModel<SupportedLanguageCode>(
  'targetLanguage', { required: true }
);
const summarize = defineModel<boolean>('summarize', { required: true });

defineProps<{
  supportedLanguages: SupportedLanguageCode[];
  isLoading: boolean;
  canProcess: boolean;
}>();

const emit = defineEmits<{
  'process': [];
}>();

</script>

<template>
  <div 
    class="d-flex flex-wrap align-center justify-end ga-2"
    data-testid="process-controls"
  >
    <v-checkbox
      v-model="summarize"
      :label="t('summarizeLabel')"
      hide-details
      density="compact"
      data-testid="summarize-checkbox"
    />
    <LanguageSelector
      v-model="targetLanguage"
      :supported-languages="supportedLanguages"
    />
    <v-btn
      id="process-button"
      rounded="xl"
      variant="flat"
      data-testid="process-button"
      class="text-none bg-primary"
      :disabled="!canProcess"
      :loading="isLoading"
      @click="emit('process')"
    >
      {{ t('processButton') }}
    </v-btn>
  </div>
</template>
