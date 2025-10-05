import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./extension/src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './extension/src')
    }
  }
})
