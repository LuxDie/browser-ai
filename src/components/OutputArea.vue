<script setup lang="ts">
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

const model = defineModel<string>({ required: true });

const copyToClipboard = () => {
  void navigator.clipboard.writeText(model.value);
};
</script>

<template>
  <div
    class="d-flex flex-column ga-2"
    data-testid="output-area"
  >
    <v-textarea
      v-model="model"
      :label="t('resultLabel')"
      rows="5"
      variant="outlined"
      readonly
      data-testid="output-field"
    >
      <template #append-inner>
        <div class="d-flex flex-column align-end justify-space-between h-100">
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            size="small"
            density="compact"
            data-testid="copy-button"
            @click="copyToClipboard"
          />
          <div class="mb-2">
            <LocalProcessingBadge />
          </div>
        </div>
      </template>
    </v-textarea>
  </div>
</template>
