import eslint from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig(
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      '.wxt/**',
      '.output/**',
      'vite.config.ts',
      'vitest.config.ts',
      'wxt.config.ts',
      'postcss.config.js',
      'tailwind.config.js',
      '*.config.cjs',
      '*.config.js',
    ],
  },
  autoImports,
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      // TODO: migrar a @stylistic/eslint-plugin para la regla de punto y coma
      '@/semi': ['error', 'always'],
      
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['extension/src/**/*test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  }
)
