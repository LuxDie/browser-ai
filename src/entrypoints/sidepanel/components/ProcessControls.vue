<script setup lang="ts">
import { browser } from 'wxt/browser';
</script>

<template>
  <div class="flex gap-2 items-end">
    <div class="flex-1">
      <label for="summarize-checkbox" class="block text-sm font-medium text-gray-700 mb-2">
        {{ browser.i18n.getMessage('optionsLabel') }}
      </label>
      <div class="flex items-center gap-2">
        <input type="checkbox" id="summarize-checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
        <label for="summarize-checkbox" class="text-sm text-gray-700">{{ browser.i18n.getMessage('summarizeLabel') }}</label>
      </div>
    </div>
    <div class="flex-1">
      <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
        {{ browser.i18n.getMessage('targetLanguageLabel') }}
      </label>
      <select id="target-language" class="input-field"></select>
    </div>
    <button id="process-button" class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"></button>
  </div>
</template>
