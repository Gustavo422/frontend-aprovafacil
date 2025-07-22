/**
 * Exemplo de uso das ferramentas de debug em um hook personalizado
 */

import { useState, useEffect, useCallback } from 'react';
import { createModuleDebugger } from '../utils/debugger';
import { measure, measureAsync } from '../utils/performance-debug';

// Criar um debugger específico para este hook
const debug = createModuleDebugger('hook', 'debugExample');

/**
 * Interface para as opções do hook
 */
interface UseDebugExampleOptions {
  initialCount?: number;
  autoIncrement?: boolean;
  incrementInterval?: number;
  maxCount?: number;
}

/**
 * Hook de exemplo que demonstra o uso das ferramentas de debug
 * 
 * @param options - Opções de configuração
 * @returns Objeto com estado e funções
 */
export function useDebugExample(options: UseDebugExampleOptions = {}) {
  const {
    initialCount = 0,
    autoIncrement = false,
    incrementInterval = 1000,
    maxCount = 10
  } = options;
  
  // Registrar inicialização do hook
  debug.info('Hook inicializado com opções: %o', options);
  
  // Estados
  const [count, setCount] = useState(initialCount);
  const [isRunning, setIsRunning] = useState(autoIncrement);
  const [error, setError] = useState<string | null>(null);
  
  // Incrementar contador
  const increment = useCallback(() => {
    debug.debug('Incrementando contador');
    
    setCount(prevCount => {
      const newCount = prevCount + 1;
      
      if (newCount > maxCount) {
        debug.warn(`Contador atingiu o valor máximo: ${maxCount}`);
        return prevCount;
      }
      
      debug(`Contador atualizado: ${prevCount} -> ${newCount}`);
      return newCount;
    });
  }, [maxCount]);
  
  // Decrementar contador
  const decrement = useCallback(() => {
    debug.debug('Decrementando contador');
    
    setCount(prevCount => {
      const newCount = prevCount - 1;
      
      if (newCount < 0) {
        debug.warn('Contador não pode ser negativo');
        return prevCount;
      }
      
      debug(`Contador atualizado: ${prevCount} -> ${newCount}`);
      return newCount;
    });
  }, []);
  
  // Resetar contador
  const reset = useCallback(() => {
    debug.info('Resetando contador para o valor inicial');
    setCount(initialCount);
  }, [initialCount]);
  
  // Iniciar incremento automático
  const start = useCallback(() => {
    debug.info('Iniciando incremento automático');
    setIsRunning(true);
  }, []);
  
  // Parar incremento automático
  const stop = useCallback(() => {
    debug.info('Parando incremento automático');
    setIsRunning(false);
  }, []);
  
  // Função assíncrona de exemplo
  const fetchRandomNumber = useCallback(async () => {
    debug.info('Buscando número aleatório');
    setError(null);
    
    try {
      const result = await measureAsync('fetchRandomNumber', async () => {
        // Simular uma requisição
        return new Promise<number>((resolve, reject) => {
          setTimeout(() => {
            const random = Math.random();
            
            if (random < 0.2) {
              debug.error('Erro ao buscar número aleatório');
              reject(new Error('Falha ao buscar número aleatório'));
            } else {
              const randomNumber = Math.floor(random * 100);
              debug.info(`Número aleatório obtido: ${randomNumber}`);
              resolve(randomNumber);
            }
          }, 1000);
        });
      });
      
      setCount(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      debug.error(`Erro: ${errorMessage}`);
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  // Efeito para incremento automático
  useEffect(() => {
    if (!isRunning) return;
    
    debug.debug('Configurando intervalo de incremento automático');
    
    const intervalId = setInterval(() => {
      debug.debug(`Incremento automático (intervalo: ${incrementInterval}ms)`);
      
      setCount(prevCount => {
        const newCount = prevCount + 1;
        
        if (newCount > maxCount) {
          debug.warn(`Incremento automático parado: contador atingiu o valor máximo (${maxCount})`);
          setIsRunning(false);
          return prevCount;
        }
        
        return newCount;
      });
    }, incrementInterval);
    
    // Limpeza
    return () => {
      debug.debug('Limpando intervalo de incremento automático');
      clearInterval(intervalId);
    };
  }, [isRunning, incrementInterval, maxCount]);
  
  // Registrar mudanças no contador
  useEffect(() => {
    debug(`Contador atualizado: ${count}`);
    
    if (count === maxCount) {
      debug.warn(`Contador atingiu o valor máximo: ${maxCount}`);
    }
  }, [count, maxCount]);
  
  // Medir performance do hook
  useEffect(() => {
    const hookPerformance = measure('hookLifecycle', () => {
      debug.info('Hook montado');
      
      return () => {
        debug.info('Hook desmontado');
      };
    });
    
    return hookPerformance;
  }, []);
  
  return {
    count,
    isRunning,
    error,
    increment,
    decrement,
    reset,
    start,
    stop,
    fetchRandomNumber
  };
}