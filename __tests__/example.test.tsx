import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Example Test Suite', () => {
  it('should render a button', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
  });

  it('should perform basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
