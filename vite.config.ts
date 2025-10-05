import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, existsSync, readdirSync, copyFileSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  publicDir: 'extension/public',
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
        sidepanel: resolve(__dirname, 'extension/src/sidepanel/sidepanel.html'),
        background: resolve(__dirname, 'extension/src/background.ts'),
        options: resolve(__dirname, 'extension/public/options.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        format: 'es', // ES modules para compatibilidad
        manualChunks: undefined, // No crear chunks separados
        assetFileNames: (assetInfo) => {
          // Move HTML files to root of dist
          const fileName = assetInfo.names?.[0] || assetInfo.name
          if (fileName === 'sidepanel.html') {
            return 'sidepanel.html'
          }
          if (fileName === 'options.html') {
            return 'options.html'
          }
          return '[name].[ext]'
        }
      }
    },
    copyPublicDir: true,
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
      }
    },
    {
      name: 'move-html-files',
      writeBundle() {
        // Move sidepanel.html to root
        const sidepanelSource = resolve(__dirname, 'dist/extension/src/sidepanel/sidepanel.html')
        const sidepanelDest = resolve(__dirname, 'dist/sidepanel.html')
        if (existsSync(sidepanelSource)) {
          copyFileSync(sidepanelSource, sidepanelDest)
          unlinkSync(sidepanelSource)
        }
        
        // Move options.html to root
        const optionsSource = resolve(__dirname, 'dist/extension/public/options.html')
        const optionsDest = resolve(__dirname, 'dist/options.html')
        if (existsSync(optionsSource)) {
          copyFileSync(optionsSource, optionsDest)
          unlinkSync(optionsSource)
        }
      }
    }
  ]
})
