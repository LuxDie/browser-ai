import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      '@': resolve(__dirname, './extension/src')
    }
  },
  esbuild: {
    target: 'es2020'
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'extension/src/background.ts'),
        sidepanel: resolve(__dirname, 'extension/src/sidepanel/sidepanel.ts'),
        options: resolve(__dirname, 'extension/src/options.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        format: 'es', // ES modules para compatibilidad
        manualChunks: undefined, // No crear chunks separados
        assetFileNames: '[name].[ext]'
      }
    },
    copyPublicDir: false,
    target: 'es2020' // Target específico para Chrome extension
  },
  plugins: [
    {
      name: 'copy-extension-files',
      generateBundle() {
        // Copy manifest.json to dist root
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: readFileSync(resolve(__dirname, 'extension/public/manifest.json'), 'utf-8')
        })
        
        // Copy icons directory
        const iconsDir = resolve(__dirname, 'extension/public/icons')
        
        if (existsSync(iconsDir)) {
          const iconFiles = readdirSync(iconsDir)
          iconFiles.forEach((file: string) => {
            this.emitFile({
              type: 'asset',
              fileName: `icons/${file}`,
              source: readFileSync(resolve(iconsDir, file))
            })
          })
        }

        // Copy HTML files directly to root
        this.emitFile({
          type: 'asset',
          fileName: 'sidepanel.html',
          source: readFileSync(resolve(__dirname, 'extension/src/sidepanel/sidepanel.html'), 'utf-8')
        })

        this.emitFile({
          type: 'asset',
          fileName: 'options.html',
          source: readFileSync(resolve(__dirname, 'extension/public/options.html'), 'utf-8')
        })
      }
    }
  ]
})
