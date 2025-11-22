<script setup lang="ts">
const modelValue = defineModel<boolean>();
</script>

<template>
  <div class="flex-1">
    <label for="summarize-checkbox" class="block text-sm font-medium text-gray-700 mb-2">
      {{ t('optionsLabel') }}
    </label>
    <div class="flex items-center gap-2">
      <input
        id="summarize-checkbox"
        v-model="modelValue"
        type="checkbox"
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      >
      <label for="summarize-checkbox" class="text-sm text-gray-700">
        {{ t('summarizeLabel') }}
      </label>
    </div>
  </div>
</template>