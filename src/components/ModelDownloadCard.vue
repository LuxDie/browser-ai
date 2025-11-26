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
  <div
    class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700"
  >
    <h5 class="mb-3 text-base font-semibold text-gray-900 md:text-xl dark:text-white">
      {{ title }}
    </h5>
    <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
      {{ t('downloadWaitMessage') }}
    </p>

    <div class="p-4 mt-4 bg-gray-100 rounded-lg dark:bg-gray-700">
      <p class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ t('progress') }}</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ progressPercentage }}%
        </span>
      </p>
      <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
        <div
          class="bg-blue-600 h-2.5 rounded-full"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <div
      v-if="status.state === 'downloading'"
      class="mt-4 flex justify-center"
    >
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        @click="emit('cancel')"
      >
        {{ t('cancelDownload') }}
      </button>
    </div>
  </div>
</template>
