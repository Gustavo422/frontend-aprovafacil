// Teste mínimo em JavaScript puro
import { describe, it, expect } from '@jest/globals';

describe('Minimal Test', () => {
  it('should pass', () => {
    console.log('Running minimal test...');
    expect(1 + 1).toBe(2);
  });
});
