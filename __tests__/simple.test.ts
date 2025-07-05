// Função de exemplo para testar
function sum(a: number, b: number): number {
  return a + b;
}

describe('Simple Test', () => {
  it('should add two numbers', () => {
    const result = sum(2, 3);
    expect(result).toBe(5);
  });

  it('should fail if the numbers do not add up correctly', () => {
    const result = sum(2, 3);
    expect(result).not.toBe(6);
  });

  it('should handle negative numbers', () => {
    const result = sum(-1, 1);
    expect(result).toBe(0);
  });

  it('should handle zero', () => {
    const result = sum(0, 0);
    expect(result).toBe(0);
  });
});
