<script setup lang="ts">
// No props needed for now as it's a static badge
</script>

<template>
  <span id="processing-source" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
    {{ browser.i18n.getMessage('localProcessingBadge') }}
  </span>
</template>
