/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends TestingLibraryMatchers<T, void> {
      toHaveBeenCalledWith(...args: any[]): void
      toHaveBeenCalled(): void
      toBe(expected: any): void
      toContain(item: any): void
    }
  }
  
  namespace jest {
    interface Expect {
      objectContaining(obj: Record<string, any>): any
    }
  }
} 