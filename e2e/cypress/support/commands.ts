// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// -- This is a child command --
Cypress.Commands.add('navigateToAdmin', () => {
  cy.visit('/admin');
  cy.url().should('include', '/admin');
});

// -- Visual testing commands --
Cypress.Commands.add('compareSnapshot', (name: string, options = {}) => {
  cy.screenshot(name, options);
  // In a real implementation, this would compare with a baseline image
});