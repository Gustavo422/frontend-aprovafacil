import { describe, it, expect } from 'vitest';

// This test demonstrates proper usage of Vitest with ESLint rules
describe('ESLint Plugin Test', () => {
  // Fixed: Added expect statement
  it('should pass eslint check with expect', () => {
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });

  // Fixed: Removed skip
  it('should pass as a normal test', () => {
    expect(true).toBe(true);
  });

  // Fixed: Removed only
  it('should pass as a normal test without focus', () => {
    expect(true).toBe(true);
  });

  // Fixed: Unique test titles
  it('first test with unique title', () => {
    expect(true).toBe(true);
  });

  it('second test with unique title', () => {
    expect(true).toBe(true);
  });

  // Fixed: Valid expect usage
  it('should pass with valid expect', () => {
    expect(true).toBe(true);
  });
});