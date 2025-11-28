<template>
  <v-tooltip
    :text="t('localProcessingBadge')"
    data-testid="processing-badge-tooltip"
  >
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        id="processing-source"
        icon="mdi-shield-check"
        size="x-small"
        color="success"
        data-testid="local-processing-badge"
      />
    </template>
  </v-tooltip>
</template>