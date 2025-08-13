import { useEffect } from 'react';

/**
 * Hook para confirmação de saída durante o simulado.
 * Ativa o diálogo nativo do navegador se `enabled` for true.
 */
export function useExitConfirmation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [enabled]);
}


