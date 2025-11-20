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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
