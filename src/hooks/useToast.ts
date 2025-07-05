import { useCallback } from 'react';
import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export const useToast = () => {
  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options: {
        duration?: number;
        position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
        icon?: string | JSX.Element;
        action?: {
          label: string;
          onClick: () => void;
        };
      } = {}
    ) => {
      const { duration = 5000, position = 'top-right', icon, action } = options;

      const toastOptions = {
        duration,
        position,
        icon,
        ...(action && {
          action: {
            label: action.label,
            onClick: () => {
              action.onClick();
              toast.dismiss();
            },
          },
        }),
      };

      switch (type) {
        case 'success':
          return toast.success(message, toastOptions);
        case 'error':
          return toast.error(message, toastOptions);
        case 'warning':
          return toast(message, {
            ...toastOptions,
            style: {
              background: '#FFA500',
              color: '#fff',
            },
            icon: icon || '⚠️',
          });
        case 'loading':
          return toast.loading(message, {
            ...toastOptions,
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          });
        default:
          return toast(message, {
            ...toastOptions,
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          });
      }
    },
    []
  );

  const dismissToast = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const updateToast = useCallback(
    (
      toastId: string,
      message: string,
      type: ToastType = 'info',
      options: {
        duration?: number;
        position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
        icon?: string | JSX.Element;
      } = {}
    ) => {
      const { duration = 5000, position = 'top-right', icon } = options;

      const toastOptions = {
        ...options,
        duration,
        position,
        icon,
      };

      switch (type) {
        case 'success':
          return toast.success(message, {
            ...toastOptions,
            id: toastId,
          });
        case 'error':
          return toast.error(message, {
            ...toastOptions,
            id: toastId,
          });
        case 'warning':
          return toast(message, {
            ...toastOptions,
            id: toastId,
            style: {
              background: '#FFA500',
              color: '#fff',
            },
            icon: icon || '⚠️',
          });
        case 'loading':
          return toast.loading(message, {
            ...toastOptions,
            id: toastId,
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          });
        default:
          return toast(message, {
            ...toastOptions,
            id: toastId,
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          });
      }
    },
    []
  );

  return {
    showToast,
    dismissToast,
    updateToast,
    dismissAll: toast.dismiss,
  };
};

// Example usage:
// const { showToast } = useToast();
// showToast('Operation successful!', 'success');
// showToast('An error occurred', 'error');
// showToast('Loading data...', 'loading');
// showToast('This is a warning', 'warning');
// showToast('Here is some information', 'info');
