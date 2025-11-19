<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  content: string | undefined;
  loading?: boolean;
  error: string | undefined;
}>();

const copied = ref(false);

const copyToClipboard = async () => {
  if (props.content) {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>

<template>
  <v-card class="mb-4" variant="outlined">
    <v-card-title class="d-flex justify-space-between align-center py-2">
      <span class="text-subtitle-1 font-weight-bold">{{ title }}</span>
      <v-btn
        v-if="content && !loading && !error"
        icon="mdi-content-copy"
        variant="text"
        size="small"
        @click="copyToClipboard"
        :color="copied ? 'success' : undefined"
      ></v-btn>
    </v-card-title>
    
    <v-divider></v-divider>

    <v-card-text class="pa-3">
      <div v-if="loading" class="d-flex justify-center align-center py-4">
        <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        <span class="ml-3 text-body-2 text-medium-emphasis">Processing...</span>
      </div>

      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-0"
      >
        {{ error }}
      </v-alert>

      <div v-else class="text-body-1" style="white-space: pre-wrap;">
        {{ content }}
      </div>
    </v-card-text>
  </v-card>
</template>
