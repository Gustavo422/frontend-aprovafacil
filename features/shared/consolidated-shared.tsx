'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';
import type { Session, User } from '@supabase/gotrue-js';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
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
  execute: <A extends unknown[]>(fn: (...args: A) => Promise<T>, ...args: A) => Promise<T | null>;
  reset: () => void;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

interface OperationResult<T> {
  data: T | null;
  error: Error | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Toast = Omit<ToasterToast, 'id'>;

type ToastState = {
  toasts: ToasterToast[];
};

type ToastAction =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

// ============================================================================
// CONSTANTES
// ============================================================================
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;
const MOBILE_BREAKPOINT = 768;

// ============================================================================
// SISTEMA DE TOAST (use-toast.ts)
// ============================================================================
let memoryState: ToastState = { toasts: [] };
const listeners: Array<(state: ToastState) => void> = [];

const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const dispatch = (action: ToastAction) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
};

let count = 0;
const genId = () => (count++).toString();

const toast = (props: Toast) => {
  const id = genId();
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => !open && dismiss(),
    },
  });

  return {
    id,
    dismiss,
    update: (newProps: Partial<ToasterToast>) =>
      dispatch({ type: 'UPDATE_TOAST', toast: { ...newProps, id } }),
  };
};

export const useToast = () => {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  useEffect(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();
    state.toasts.forEach((t) => {
      if (t.open === false && !timeouts.has(t.id)) {
        const timeout = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', toastId: t.id });
          timeouts.delete(t.id);
        }, TOAST_REMOVE_DELAY);
        timeouts.set(t.id, timeout);
      }
    });
    return () => timeouts.forEach((timeout) => clearTimeout(timeout));
  }, [state.toasts]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
};

// ============================================================================
// HOOKS DE ERRO (use-error-handler.ts)
// ============================================================================
export function useErrorHandler<T,>(options: ErrorHandlerOptions = {}): ErrorHandlerResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    showToast = true,
    toastTitle = 'Erro',
    onError,
    fallbackMessage = 'Ocorreu um erro inesperado.',
  } = options;

  const execute = useCallback(
    async <A extends unknown[]>(fn: (...args: A) => Promise<T>, ...args: A): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (err: unknown) {
        const caughtError = err instanceof Error ? err : new Error(String(err) || fallbackMessage);
        setError(caughtError);
        onError?.(caughtError);
        if (showToast) {
          toast({
            title: toastTitle,
            description: caughtError.message,
            variant: 'destructive',
          });
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, toastTitle, fallbackMessage, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}

// ============================================================================
// HOOK DE RETRY (use-auth-retry.ts)
// ============================================================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function retryWithBackoff<T,>(
  fn: () => Promise<OperationResult<T>>,
  options: RetryOptions = {}
): Promise<OperationResult<T>> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      // Se não houver erro, retorne o sucesso
      if (result.error === null) return result;
      
      // Verifica se é um erro que não deve ser tentado novamente (ex: não é 401)
      const isAuthError = result.error && 'status' in result.error && (result.error as { status?: number }).status === 401;
      if (!isAuthError) return result;

    } catch (error) {
      // Se a própria função `fn` lançar uma exceção, e for a última tentativa
      if (attempt === maxRetries) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
      }
    }
    
    // Se chegou aqui, é um erro que permite retry, então aguarda e tenta de novo
    const delayMs = baseDelay * 2 ** (attempt - 1);
    onRetry?.(attempt, delayMs);
    await delay(delayMs);
  }

  return { data: null, error: new Error('O número máximo de tentativas foi atingido.') };
}

// ============================================================================
// HOOK DE MOBILE (use-mobile.ts)
// ============================================================================
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkSize = () => setIsMobile(window.innerWidth < breakpoint);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}

// ============================================================================
// SISTEMA DE CACHE (cache.ts)
// ============================================================================
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl ?? 5 * 60 * 1000;
    this.maxSize = options.maxSize ?? 100;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttl ?? this.defaultTtl });
  }

  delete(key: string): void { this.cache.delete(key); }
  clear(): void { this.cache.clear(); }
}

// ============================================================================
// HOOK DE AUTENTICAÇÃO (use-auth.ts)
// ============================================================================
// Supondo que você tenha um AuthContext em algum lugar
// Ex: frontend/features/auth/contexts/auth-context.tsx
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    signIn: (credentials: unknown) => Promise<{ error: Error | null }>;
    signUp: (credentials: unknown) => Promise<{ error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// RE-EXPORTS PARA COMPATIBILIDADE
// ============================================================================
export { toast as sharedToast };
// Re-exporting Session and User might not be necessary if they are correctly imported
// where needed. If you still need them globally, ensure the import is correct.
// For now, removing the explicit re-export as it might be causing issues if the
// import itself is problematic.
// export type { Session, User };