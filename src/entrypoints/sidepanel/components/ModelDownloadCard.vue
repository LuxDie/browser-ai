<script setup lang="ts">
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

defineProps<{
  status: AIModelStatus;
}>();
</script>

<template>
  <div
    class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700"
  >
    <h5 class="mb-3 text-base font-semibold text-gray-900 md:text-xl dark:text-white">
      Descargando modelo de IA
    </h5>
    <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
      El modelo se está descargando en segundo plano. Puedes seguir usando la extensión.
    </p>

    <div class="p-4 mt-4 bg-gray-100 rounded-lg dark:bg-gray-700">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-900 dark:text-white">Progreso</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ (status.downloadProgress ?? 0).toFixed(2) }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
        <div
          class="bg-blue-600 h-2.5 rounded-full"
          :style="{ width: `${status.downloadProgress ?? 0}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
