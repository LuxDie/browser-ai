<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<template>
  <div class="flex-1">
    <label for="summarize-checkbox" class="block text-sm font-medium text-gray-700 mb-2">
      {{ browser.i18n.getMessage('optionsLabel') }}
    </label>
    <div class="flex items-center gap-2">
      <input
        id="summarize-checkbox"
        type="checkbox"
        :checked="modelValue"
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      >
      <label for="summarize-checkbox" class="text-sm text-gray-700">
        {{ browser.i18n.getMessage('summarizeLabel') }}
      </label>
    </div>
  </div>
</template>
