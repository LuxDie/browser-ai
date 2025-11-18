import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { WxtVitest } from 'wxt/testing/vitest-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [WxtVitest(), vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    mockReset: true,
    silent: true,
    css: true,
    server: {
      deps: {
        inline: [/vuetify/],
      },
    },
  },
  server: {
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'vuetify/lib/components/VCode/VCode.css': resolve(__dirname, './src/tests/mocks/style.mock.ts'),
    }
  }
})
