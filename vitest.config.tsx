/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
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
    // Configuração simplificada de cobertura
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/.next/**',
        '**/*.config.*',
        '**/types/**',
        '**/coverage/**',
      ],
    },
    // Padrões de inclusão/exclusão simplificados
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
    ],
    // Timeout aumentado para testes
    testTimeout: 30000,
    // Configurações de mocks
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '^@/(.*)$': resolve(__dirname, './$1'),
    },
  },
});
