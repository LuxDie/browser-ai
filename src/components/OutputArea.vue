<script setup lang="ts">
defineProps<{
  translatedText: string;
}>();
</script>

<template>
  <div v-if="translatedText" class="flex flex-col gap-2">
    <div class="flex justify-between items-center">
      <label for="output-text">{{ t('resultLabel') }}:</label>
      <span id="processing-source" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
        {{ t('localProcessingBadge') }}
      </span>
    </div>
    <textarea id="output-text" :value="translatedText" class="border p-2 rounded-md" rows="5" readonly></textarea>
  </div>
</template>
