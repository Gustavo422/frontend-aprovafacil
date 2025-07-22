import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'e2e/cypress/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'e2e/cypress/support/e2e.ts',
    videosFolder: 'e2e/cypress/videos',
    screenshotsFolder: 'e2e/cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'e2e/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'e2e/cypress/support/component.ts',
  },
});