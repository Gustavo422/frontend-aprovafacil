import { renderHook, act } from '@testing-library/react';
import { useSafeAction } from '@/hooks/use-safe-action';
import { toast } from 'sonner';

// Mock the toast module
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('useSafeAction', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should handle successful action', async () => {
    const mockAction = jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } });
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useSafeAction(mockAction, {
        onSuccess,
        onError,
        onComplete,
        successMessage: 'Success!',
        errorMessage: 'Error!',
      })
    );

    await act(async () => {
      await result.current.execute({ id: 1 });
    });

    expect(mockAction).toHaveBeenCalledWith({ id: 1 });
    expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'Test' });
    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Success!');
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle action with error', async () => {
    const errorMessage = 'Something went wrong';
    const mockAction = jest.fn().mockResolvedValue({ error: errorMessage });
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useSafeAction(mockAction, {
        onSuccess,
        onError,
        errorMessage: 'Custom error message',
      })
    );

    await act(async () => {
      await result.current.execute({});
    });

    expect(mockAction).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(errorMessage);
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle field errors', async () => {
    const fieldErrors = {
      email: ['Invalid email'],
      password: ['Password too short'],
    };
    const mockAction = jest.fn().mockResolvedValue({ fieldErrors });
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useSafeAction(mockAction, { onError })
    );

    await act(async () => {
      await result.current.execute({});
    });

    expect(onError).toHaveBeenCalledWith('Invalid email');
    expect(toast.error).toHaveBeenCalledWith('Invalid email');
    expect(result.current.error).toBe('Invalid email');
  });

  it('should handle thrown errors', async () => {
    const error = new Error('Unexpected error');
    const mockAction = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useSafeAction(mockAction, {
        onError,
        errorMessage: 'Custom error message',
      })
    );

    await act(async () => {
      await result.current.execute({});
    });

    expect(mockAction).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Unexpected error');
    expect(toast.error).toHaveBeenCalledWith('Unexpected error');
    expect(result.current.error).toBe('Unexpected error');
  });

  it('should use custom error message when provided', async () => {
    const error = new Error('Unexpected error');
    const mockAction = jest.fn().mockRejectedValue(error);
    const customErrorMessage = 'Custom error message';

    const { result } = renderHook(() =>
      useSafeAction(mockAction, {
        errorMessage: customErrorMessage,
      })
    );

    await act(async () => {
      await result.current.execute({});
    });

    expect(toast.error).toHaveBeenCalledWith(customErrorMessage);
    expect(result.current.error).toBe(customErrorMessage);
  });

  it('should handle success message', async () => {
    const mockAction = jest.fn().mockResolvedValue({ data: { id: 1 } });
    const successMessage = 'Operation successful';

    const { result } = renderHook(() =>
      useSafeAction(mockAction, {
        successMessage,
      })
    );

    await act(async () => {
      await result.current.execute({});
    });

    expect(toast.success).toHaveBeenCalledWith(successMessage);
  });
});
