<script setup lang="ts">
const modelValue = defineModel<boolean>();
</script>

<template>
  <v-checkbox
    v-model="modelValue"
    :label="t('summarizeLabel')"
    class="flex-1"
  />
</template>
