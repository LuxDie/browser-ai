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
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
