<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

const props = defineProps<{
  status: AIModelStatus;
  params?: {
    source: string;
    target: string;
  };
}>();

const emit = defineEmits<{
  cancel: [];
}>();


// Computed para obtener el título
const title = computed(() => {
  if (props.params) {
    return t('downloadingTranslator', [props.params.source, props.params.target]);
  }
  return t('downloadingSummarizer');
});

const progressPercentage = computed(() => {
  return Math.round(props.status.downloadProgress ?? 0);
});
</script>

<template>
  <v-card
    class="w-full max-w-sm"
    elevation="2"
    data-testid="model-download-card"
  >
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <p class="text-body-2">
        {{ t('downloadWaitMessage') }}
      </p>

      <div class="mt-4">
        <div class="d-flex justify-space-between mb-1">
          <span class="text-body-2">{{ t('progress') }}</span>
          <span class="text-body-2">{{ progressPercentage }}%</span>
        </div>
        <v-progress-linear
          v-model="progressPercentage"
          color="primary"
          height="10"
          rounded
          data-testid="progress-indicator"
        />
      </div>

      <div
        v-if="status.state === 'downloading'"
        class="mt-4 d-flex justify-center"
      >
        <v-btn
          variant="outlined"
          data-testid="cancel-download-button"
          @click="emit('cancel')"
        >
          {{ t('cancelDownload') }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>