<script setup lang="ts">
defineProps<{
  translatedText: string;
}>();
</script>

<template>
  <div v-if="translatedText" class="d-flex flex-column ga-2">
    <v-textarea
      :label="t('resultLabel')"
      :model-value="translatedText"
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
