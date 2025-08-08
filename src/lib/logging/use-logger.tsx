'use client';

import { useCallback } from 'react';
import type { Logger } from '@/src/lib/logging';
import { getLogger } from '@/src/lib/logging';

/**
 * Hook for using the logger in React components
 * @param name Logger name
 * @param context Logger context
 * @returns Logger instance
 */
export function useLogger(name: string, context: Record<string, unknown> = {}): Logger {
  // Get logger instance
  const logger = getLogger(name, context);
  
  // Memoize logger methods
  const debug = useCallback(
    (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
    [logger]
  );
  
  const info = useCallback(
    (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
    [logger]
  );
  
  const warn = useCallback(
    (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    [logger]
  );
  
  const error = useCallback(
    (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
    [logger]
  );
  
  const child = useCallback(
    (childContext: Record<string, unknown>) => logger.child(childContext),
    [logger]
  );
  
  // Return memoized logger
  return {
    debug,
    info,
    warn,
    error,
    child
  };
}
