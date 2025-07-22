'use client';

import { useToast } from '@/features/shared/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, titulo, descricao, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {titulo && <ToastTitle>{titulo}</ToastTitle>}
              {descricao && (
                <ToastDescription>{descricao}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
