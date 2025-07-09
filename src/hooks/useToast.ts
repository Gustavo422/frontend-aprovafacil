import { useCallback } from 'react';
import toast from 'react-hot-toast';
import type { ReactElement } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  duration?: number;
  icon?: string | ReactElement;
  style?: React.CSSProperties;
}

interface ToastConfig {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId: string) => void;
  remove: () => void;
}

export const useToast = (): ToastConfig => {
  const showToast = useCallback((type: ToastType, message: string, options: ToastOptions = {}) => {
    const { duration = 4000, icon, style } = options;

    const toastOptions = {
      duration,
      style: {
        background: type === 'error' ? '#ef4444' : 
                   type === 'success' ? '#22c55e' : 
                   type === 'warning' ? '#f59e0b' : '#3b82f6',
        color: '#fff',
        ...style,
      },
    };

    switch (type) {
      case 'success':
        return toast.success(message, toastOptions);
      case 'error':
        return toast.error(message, toastOptions);
      case 'warning':
        return toast(message, { ...toastOptions, icon: icon || '⚠️' });
      case 'info':
        return toast(message, { ...toastOptions, icon: icon || 'ℹ️' });
      case 'loading':
        return toast.loading(message, toastOptions);
      default:
        return toast(message, toastOptions);
    }
  }, []);

  const dismiss = useCallback((toastId: string) => {
    toast.dismiss(toastId);
  }, []);

  const remove = useCallback(() => {
    toast.remove();
  }, []);

  return {
    success: (message: string, options?: ToastOptions) => showToast('success', message, options),
    error: (message: string, options?: ToastOptions) => showToast('error', message, options),
    info: (message: string, options?: ToastOptions) => showToast('info', message, options),
    warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
    loading: (message: string, options?: ToastOptions) => showToast('loading', message, options),
    dismiss,
    remove,
  };
};

// Hook para toast com ícones personalizados
export const useCustomToast = () => {
  const toast = useToast();

  const showSuccessWithIcon = useCallback((message: string, icon?: ReactElement) => {
    return toast.success(message, { icon });
  }, [toast]);

  const showErrorWithIcon = useCallback((message: string, icon?: ReactElement) => {
    return toast.error(message, { icon });
  }, [toast]);

  return {
    ...toast,
    showSuccessWithIcon,
    showErrorWithIcon,
  };
};

// Example usage:
// const { showToast } = useToast();
// showToast('Operation successful!', 'success');
// showToast('An error occurred', 'error');
// showToast('Loading data...', 'loading');
// showToast('This is a warning', 'warning');
// showToast('Here is some information', 'info');
