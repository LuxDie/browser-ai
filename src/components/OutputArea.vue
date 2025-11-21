<script setup lang="ts">
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

defineProps<{
  translatedText: string;
}>();
</script>

<template>
  <div v-if="translatedText" class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <label for="output-text">{{ t('resultLabel') }}</label>
      <LocalProcessingBadge />
    </div>
    <textarea id="output-text" :value="translatedText" class="border p-2 rounded-md" rows="5" readonly></textarea>
  </div>
</template>
