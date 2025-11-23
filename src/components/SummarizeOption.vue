<script setup lang="ts">
const modelValue = defineModel<boolean>('modelValue');
</script>

<template>
  <v-checkbox
    v-model="modelValue"
    :label="t('summarizeLabel')"
    class="flex-1"
  />
</template>
