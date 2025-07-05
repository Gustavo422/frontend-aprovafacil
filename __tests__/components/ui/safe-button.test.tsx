import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SafeButton } from '@/components/ui/safe-button';
import { toast } from 'sonner';

// Mock the toast module
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('SafeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(<SafeButton action={jest.fn()}>Click me</SafeButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls the action when clicked', async () => {
    const mockAction = jest.fn().mockResolvedValue({});
    render(<SafeButton action={mockAction}>Click me</SafeButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(mockAction).toHaveBeenCalled();
    });
  });

  it('shows loading spinner when action is in progress', async () => {
    let resolveAction: (value: any) => void;
    const mockAction = jest.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveAction = resolve;
      })
    );
    
    render(<SafeButton action={mockAction} showSpinner>Loading</SafeButton>);
    
    fireEvent.click(screen.getByText('Loading'));
    
    // Check if spinner is shown
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Resolve the promise to clean up
    resolveAction!({});
    await waitFor(() => {}); // Wait for state updates
  });

  it('disables the button when disableOnLoading is true', async () => {
    let resolveAction: (value: any) => void;
    const mockAction = jest.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveAction = resolve;
      })
    );
    
    render(
      <SafeButton 
        action={mockAction} 
        disableOnLoading
        data-testid="test-button"
      >
        Click me
      </SafeButton>
    );
    
    const button = screen.getByTestId('test-button');
    fireEvent.click(button);
    
    // Button should be disabled while loading
    expect(button).toBeDisabled();
    
    // Resolve the promise to clean up
    resolveAction!({});
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('shows error toast when action fails', async () => {
    const errorMessage = 'Failed to load data';
    const mockAction = jest.fn().mockRejectedValue(new Error(errorMessage));
    
    render(
      <SafeButton 
        action={mockAction}
        errorMessage="Custom error message"
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Custom error message');
    });
  });

  it('shows success toast when action succeeds with successMessage', async () => {
    const mockAction = jest.fn().mockResolvedValue({ data: { success: true } });
    
    render(
      <SafeButton 
        action={mockAction}
        successMessage="Operation successful"
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Operation successful');
    });
  });

  it('calls onSuccess callback when action succeeds', async () => {
    const mockAction = jest.fn().mockResolvedValue({ data: { id: 1 } });
    const onSuccess = jest.fn();
    
    render(
      <SafeButton 
        action={mockAction}
        onSuccess={onSuccess}
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('calls onError callback when action fails', async () => {
    const error = new Error('Failed');
    const mockAction = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();
    
    render(
      <SafeButton 
        action={mockAction}
        onError={onError}
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed');
    });
  });

  it('calls onComplete callback after action completes (success or error)', async () => {
    const mockAction = jest.fn().mockResolvedValue({});
    const onComplete = jest.fn();
    
    const { rerender } = render(
      <SafeButton 
        action={mockAction}
        onComplete={onComplete}
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    
    // Test with error
    onComplete.mockClear();
    const errorAction = jest.fn().mockRejectedValue(new Error('Failed'));
    
    rerender(
      <SafeButton 
        action={errorAction}
        onComplete={onComplete}
      >
        Click me
      </SafeButton>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
