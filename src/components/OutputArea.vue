<script setup lang="ts">
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

defineProps<{
  result: string;
}>();

const t = browser.i18n.getMessage;
</script>

<template>
  <div v-if="result" class="d-flex flex-column ga-2">
    <v-textarea
      :label="t('resultLabel')"
      :model-value="result"
      rows="5"
      variant="outlined"
      readonly
    >
    </v-textarea>
    <LocalProcessingBadge />
  </div>
</template>
