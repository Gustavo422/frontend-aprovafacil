# End-to-End Tests

This directory contains end-to-end tests for the application, focusing on the admin panel functionality.

## Test Structure

- `admin-panel.e2e.test.ts`: Tests for the admin panel navigation and basic functionality
- `admin-crud.e2e.test.ts`: Tests for CRUD operations in the admin panel
- `visual-tests/`: Visual regression tests for the admin panel using Playwright
- `cypress/e2e/admin-panel.cy.ts`: Tests for the admin panel using Cypress
- `cypress/e2e/admin-visual.cy.ts`: Visual regression tests for the admin panel using Cypress

## Running Tests

### Functional E2E Tests with Vitest/Playwright

To run the functional E2E tests:

```bash
npm run test:e2e
```

To run with UI:

```bash
npm run test:e2e:ui
```

### Visual Regression Tests with Playwright

To run the visual regression tests:

```bash
npm run test:visual
```

To update the baseline screenshots:

```bash
npm run test:visual:update
```

### Playwright Tests

To run all Playwright tests:

```bash
npm run test:playwright
```

To run with UI:

```bash
npm run test:playwright:ui
```

To debug:

```bash
npm run test:playwright:debug
```

### Cypress Tests

To open Cypress in interactive mode:

```bash
npm run cypress:open
```

To run Cypress tests in headless mode:

```bash
npm run cypress:run
```

To run Cypress visual tests:

```bash
npm run cypress:visual
```

## Test Fixtures

The tests use mock data to simulate API responses. The mock data is defined in the test files.

## Visual Regression Testing

### Playwright Visual Regression

Playwright visual regression tests capture screenshots of UI components and compare them with baseline images to detect visual changes. The baseline images are stored in the `e2e/visual-tests/screenshots` directory.

When running visual regression tests for the first time, use the `--update-snapshots` flag to create the baseline images:

```bash
npm run test:visual:update
```

Subsequent runs will compare the current UI with the baseline images and fail if there are significant differences.

### Cypress Visual Regression

Cypress visual regression tests use the `compareSnapshot` custom command to capture screenshots and compare them with baseline images. The baseline images are stored in the `cypress/screenshots` directory.

When running Cypress visual tests for the first time, the baseline images will be created automatically. To update the baseline images, delete the existing screenshots and run the tests again.

## Troubleshooting

If tests are failing due to UI changes, update the baseline images:

- For Playwright: `npm run test:visual:update`
- For Cypress: Delete the existing screenshots and run the tests again

If tests are failing due to timing issues, try increasing the timeout in the test configuration.