<script setup lang="ts">
import DetectedLanguage from '@/components/DetectedLanguage.vue';

const model = defineModel<string>({ required: true });

defineProps<{
  language: string | null;
}>();
</script>

<template>
  <v-textarea
    v-model="model"
    :label="t('inputLabel')"
    rows="5"
    variant="outlined"
    data-testid="input-area"
  >
    <template #append-inner>
      <DetectedLanguage
        :language
      />
    </template>
  </v-textarea>
</template>
