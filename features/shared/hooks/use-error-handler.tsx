'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { logger } from '../../../core/utils/logger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  onError?: (error: Error) => void;
  fallbackMessage?: string;
}

interface ErrorHandlerResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (fn: (...args: unknown[]) => Promise<T>, ...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useErrorHandler<T = unknown>(options: ErrorHandlerOptions = {}): ErrorHandlerResult<T> {
  const { showToast = true, toastTitle, onError, fallbackMessage } = options;
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (fn: (...args: unknown[]) => Promise<T>, ...args: unknown[]): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setIsLoading(false);
      logger.error('useErrorHandler', { error: errorObj });
      if (showToast) {
        toast({
          title: toastTitle || 'Erro',
          description: fallbackMessage || errorObj.message,
          variant: 'destructive',
        });
      }
      if (onError) onError(errorObj);
      return null;
    }
  }, [showToast, toast, toastTitle, fallbackMessage, onError]);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}

// Hook especializado para operações de autenticação
export function useAuthErrorHandler() {
  return useErrorHandler({
    showToast: true,
    toastTitle: 'Erro de Autenticação',
    fallbackMessage:
      'Erro ao autenticar. Verifique suas credenciais e tente novamente.',
  });
}

// Hook especializado para operações de dados
export function useDataErrorHandler() {
  return useErrorHandler({
    showToast: true,
    toastTitle: 'Erro de Dados',
    fallbackMessage: 'Erro ao carregar dados. Tente novamente.',
  });
}

// Hook especializado para operações de formulário
export function useFormErrorHandler() {
  return useErrorHandler({
    showToast: true,
    toastTitle: 'Erro de Formulário',
    fallbackMessage:
      'Erro ao processar formulário. Verifique os dados e tente novamente.',
  });
} 