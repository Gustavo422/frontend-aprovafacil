import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        ...configDefaults.coverage.exclude || [],
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/__tests__/**',
        '**/*.d.ts',
        '**/.next/**',
        '**/out/**',
        '**/public/**',
      ],
    },
    // Add global test timeout
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      // Add any necessary aliases here
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
  },
});
