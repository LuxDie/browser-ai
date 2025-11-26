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
  <div class="flex flex-col gap-2">
    <label for="input-text">{{ t('inputLabel') }}</label>
    <textarea
      id="input-text"
      v-model="modelValue"
      class="border p-2 rounded-md"
      rows="5"
    />
    <DetectedLanguage
      v-if="sourceLanguage"
      :source-language="sourceLanguage"
    />
  </div>
</template>
