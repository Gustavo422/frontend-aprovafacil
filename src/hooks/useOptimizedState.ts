import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Hook otimizado para gerenciar estado com redução de re-renders
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const previousValueRef = useRef<T>(initialValue);

  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      
      // Só atualiza se o valor realmente mudou
      if (JSON.stringify(nextValue) !== JSON.stringify(prev)) {
        previousValueRef.current = prev;
        return nextValue;
      }
      
      return prev;
    });
  }, []);

  const hasChanged = useMemo(() => {
    return JSON.stringify(state) !== JSON.stringify(previousValueRef.current);
  }, [state]);

  return [state, setOptimizedState, hasChanged] as const;
}

/**
 * Hook para debounce de valores
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de valores
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook para memoização de objetos complexos
 */
export function useMemoizedObject<T extends Record<string, unknown>>(obj: T): T {
  return useMemo(() => obj, [obj]);
}

/**
 * Hook para memoização de arrays
 */
export function useMemoizedArray<T>(array: T[]): T[] {
  return useMemo(() => array, [array]);
}

/**
 * Hook para cache de funções
 */
export function useCachedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
}

/**
 * Hook para estado com persistência
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  storage: Storage = localStorage
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
      setState(newValue);
      storage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state, storage]);

  return [state, setPersistedState];
}

/**
 * Hook para estado com validação
 */
export function useValidatedState<T>(
  initialValue: T,
  validator: (value: T) => boolean | string
): [T, (value: T) => void, boolean, string | null] {
  const [state, setState] = useState<T>(initialValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setValidatedState = useCallback((value: T) => {
    const validation = validator(value);
    
    if (typeof validation === 'boolean') {
      setIsValid(validation);
      setError(validation ? null : 'Valor inválido');
    } else {
      setIsValid(false);
      setError(validation);
    }
    
    setState(value);
  }, [validator]);

  return [state, setValidatedState, isValid, error];
}

/**
 * Hook para estado com histórico
 */
export function useStateWithHistory<T>(
  initialValue: T,
  maxHistory = 10
): [T, (value: T) => void, () => void, () => void, T[]] {
  const [state, setState] = useState<T>(initialValue);
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const setStateWithHistory = useCallback((value: T) => {
    setState(value);
    setHistory(prev => {
      const newHistory = [...prev.slice(0, currentIndex + 1), value];
      if (newHistory.length > maxHistory) {
        return newHistory.slice(-maxHistory);
      }
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [currentIndex, history]);

  return [state, setStateWithHistory, undo, redo, history];
}

/**
 * Hook para estado com comparação profunda
 */
export function useDeepState<T>(initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const previousValueRef = useRef<T>(initialValue);

  const setDeepState = useCallback((value: T) => {
    const prevStr = JSON.stringify(previousValueRef.current);
    const nextStr = JSON.stringify(value);
    
    if (prevStr !== nextStr) {
      previousValueRef.current = state;
      setState(value);
    }
  }, [state]);

  return [state, setDeepState];
} 