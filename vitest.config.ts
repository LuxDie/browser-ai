
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [WxtVitest(), vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
    deps: {
      inline: ['vuetify'],
    },
  },
});
