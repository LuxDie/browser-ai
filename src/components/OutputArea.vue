<script setup lang="ts">
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

defineProps<{
  translatedText: string;
}>();
</script>

<template>
  <div
    v-if="translatedText"
    class="d-flex flex-column ga-2">
    <v-textarea
      :label="t('resultLabel')"
      :model-value="translatedText"
      data-testid="output-textarea"
      rows="5"
      variant="outlined"
      readonly
    >
      <template #append-inner>
        <LocalProcessingBadge />
      </template>
    </v-textarea>
  </div>
</template>