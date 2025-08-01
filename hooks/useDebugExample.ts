/**
 * Exemplo de uso das ferramentas de debug em um hook personalizado
 */

import { useState, useEffect, useCallback } from 'react';

// Remover: import { createModuleDebugger } from '../utils/debugger';
// Remover: import { measure, measureAsync } from '../utils/performance-debug';

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
  // Remover: debug.info('Hook inicializado com opções: %o', options);
  
  // Estados
  const [count, setCount] = useState(initialCount);
  const [isRunning, setIsRunning] = useState(autoIncrement);
  const [error, setError] = useState<string | null>(null);
  
  // Incrementar contador
  const increment = useCallback(() => {
    // Remover: debug.debug('Incrementando contador');
    
    setCount(prevCount => {
      const newCount = prevCount + 1;
      
      if (newCount > maxCount) {
        // Remover: debug.warn(`Contador atingiu o valor máximo: ${maxCount}`);
        return prevCount;
      }
      
      // Remover: debug(`Contador atualizado: ${prevCount} -> ${newCount}`);
      return newCount;
    });
  }, [maxCount]);
  
  // Decrementar contador
  const decrement = useCallback(() => {
    // Remover: debug.debug('Decrementando contador');
    
    setCount(prevCount => {
      const newCount = prevCount - 1;
      
      if (newCount < 0) {
        // Remover: debug.warn('Contador não pode ser negativo');
        return prevCount;
      }
      
      // Remover: debug(`Contador atualizado: ${prevCount} -> ${newCount}`);
      return newCount;
    });
  }, []);
  
  // Resetar contador
  const reset = useCallback(() => {
    // Remover: debug.info('Resetando contador para o valor inicial');
    setCount(initialCount);
  }, [initialCount]);
  
  // Iniciar incremento automático
  const start = useCallback(() => {
    // Remover: debug.info('Iniciando incremento automático');
    setIsRunning(true);
  }, []);
  
  // Parar incremento automático
  const stop = useCallback(() => {
    // Remover: debug.info('Parando incremento automático');
    setIsRunning(false);
  }, []);
  
  // Função assíncrona de exemplo
  const fetchRandomNumber = useCallback(async () => {
    // Remover: debug.info('Buscando número aleatório');
    setError(null);
    
    try {
      // Remover: const result = await measureAsync('fetchRandomNumber', async () => {
      // Simular uma requisição
      return new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          const random = Math.random();
          
          if (random < 0.2) {
            // Remover: debug.error('Erro ao buscar número aleatório');
            reject(new Error('Falha ao buscar número aleatório'));
          } else {
            const randomNumber = Math.floor(random * 100);
            // Remover: debug.info(`Número aleatório obtido: ${randomNumber}`);
            resolve(randomNumber);
          }
        }, 1000);
      });
      
      // setCount(result); // Removido: result não existe mais
      return new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          const random = Math.random();
          
          if (random < 0.2) {
            // Remover: debug.error('Erro ao buscar número aleatório');
            reject(new Error('Falha ao buscar número aleatório'));
          } else {
            const randomNumber = Math.floor(random * 100);
            // Remover: debug.info(`Número aleatório obtido: ${randomNumber}`);
            resolve(randomNumber);
          }
        }, 1000);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // Remover: debug.error(`Erro: ${errorMessage}`);
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  // Efeito para incremento automático
  useEffect(() => {
    if (!isRunning) return;
    
    // Remover: debug.debug('Configurando intervalo de incremento automático');
    
    const intervalId = setInterval(() => {
      // Remover: debug.debug(`Incremento automático (intervalo: ${incrementInterval}ms)`);
      
      setCount(prevCount => {
        const newCount = prevCount + 1;
        
        if (newCount > maxCount) {
          // Remover: debug.warn(`Incremento automático parado: contador atingiu o valor máximo (${maxCount})`);
          setIsRunning(false);
          return prevCount;
        }
        
        return newCount;
      });
    }, incrementInterval);
    
    // Limpeza
    return () => {
      // Remover: debug.debug('Limpando intervalo de incremento automático');
      clearInterval(intervalId);
    };
  }, [isRunning, incrementInterval, maxCount]);
  
  // Registrar mudanças no contador
  useEffect(() => {
    // Remover: debug(`Contador atualizado: ${count}`);
    
    if (count === maxCount) {
      // Remover: debug.warn(`Contador atingiu o valor máximo: ${maxCount}`);
    }
  }, [count, maxCount]);
  
  // Medir performance do hook
  useEffect(() => {
    // Remover: const hookPerformance = measure('hookLifecycle', () => {
    // Remover: debug.info('Hook montado');
    
    // Remover: return () => {
    // Remover: debug.info('Hook desmontado');
    // Remover: };
    // Remover: });
    
    // Remover: return hookPerformance;
    return () => {}; // Placeholder for performance measurement
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