import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Bloqueia navegação via botão Voltar (popstate) e mostra um diálogo ao usuário.
 * Retorna estado e ações para controlar a saída.
 */
export function useBlockNavigation(enabled: boolean) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isBlockingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    isBlockingRef.current = true;
    const onPopState = (e: PopStateEvent) => {
      if (!isBlockingRef.current) return;
      // Reverte a navegação e abre o diálogo
      history.pushState(null, '', window.location.href);
      setDialogOpen(true);
    };
    // Empurra um novo estado para poder capturar o próximo back
    try {
      history.pushState(null, '', window.location.href);
    } catch {}
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      isBlockingRef.current = false;
    };
  }, [enabled]);

  const disableBlocking = useCallback(() => {
    isBlockingRef.current = false;
  }, []);

  return {
    dialogOpen,
    setDialogOpen,
    disableBlocking,
  } as const;
}


