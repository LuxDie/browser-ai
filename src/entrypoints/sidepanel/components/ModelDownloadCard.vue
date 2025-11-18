<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

defineProps<{
  status: AIModelStatus;
  canCancel?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
}>();

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <v-card class="mb-4">
    <v-card-title>Descargando modelo de IA</v-card-title>
    <v-card-text>
      <p>El modelo se está descargando en segundo plano. Puedes seguir usando la extensión.</p>
      <v-progress-linear
        :model-value="status.downloadProgress ?? 0"
        height="10"
        striped
        class="mt-4"
      ></v-progress-linear>
    </v-card-text>
    <v-card-actions v-if="canCancel && status.state === 'downloading'">
      <v-btn @click="handleCancel" block>
        Cancelar descarga
      </v-btn>
    </v-card-actions>
  </v-card>
</template>