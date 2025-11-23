<script setup lang="ts">
defineProps<{
  apiAvailable: boolean;
}>();
</script>

<template>
  <header>
    <v-alert
      v-if="!apiAvailable"
      id="api-warning-container"
      :text="t('apiWarning')"
      type="warning"
      variant="tonal"
    />
  </header>
</template>
