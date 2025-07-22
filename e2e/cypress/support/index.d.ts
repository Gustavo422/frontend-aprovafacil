/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      navigateToAdmin(): Chainable<void>;
      compareSnapshot(name: string, options?: Partial<ScreenshotOptions>): Chainable<void>;
    }
  }
}

export {}; 