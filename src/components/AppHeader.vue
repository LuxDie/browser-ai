<script setup lang="ts">
defineProps<{
  apiAvailable: boolean;
}>();
</script>

<template>
  <header>
    <div v-if="!apiAvailable" id="api-warning-container" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-yellow-800 text-xs">
        {{ t('apiWarning') }}
      </p>
    </div>
  </header>
</template>
