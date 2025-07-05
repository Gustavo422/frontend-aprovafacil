import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { formatDate } from '@/lib/formatDate';

describe('formatDate', () => {
  // Mock console.error to avoid polluting test output
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('formats a valid ISO date string correctly', () => {
    // Note: Months are 0-indexed in JavaScript Date constructor
    const date = new Date(Date.UTC(2023, 0, 1)); // January 1, 2023
    const isoString = date.toISOString();
    
    const result = formatDate(isoString);
    expect(result).toBe('January 1, 2023');
  });

  it('returns an empty string for invalid date strings', () => {
    const result = formatDate('not-a-date');
    expect(result).toBe('');
    expect(console.error).toHaveBeenCalledWith(
      'Error formatting date:',
      expect.any(Error)
    );
  });

  it('returns an empty string for empty input', () => {
    const result = formatDate('');
    expect(result).toBe('');
  });

  it('handles null or undefined input', () => {
    // @ts-expect-error - Testing invalid input
    expect(formatDate(null)).toBe('');
    // @ts-expect-error - Testing invalid input
    expect(formatDate(undefined)).toBe('');
  });
});
