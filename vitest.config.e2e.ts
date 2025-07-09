/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // E2E tests run in Node environment with Playwright
    setupFiles: ['./e2e/setup.ts'],
    include: ['e2e/**/*.e2e.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 30000, // 30 seconds for E2E tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000,
    maxConcurrency: 1, // Run E2E tests sequentially to avoid conflicts
    coverage: {
      enabled: false, // Disable coverage for E2E tests
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './e2e/reports/index.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  define: {
    'process.env': process.env,
  },
})

