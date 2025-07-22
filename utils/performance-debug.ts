/**
 * Utilitários para debug de performance no frontend
 * 
 * Este módulo fornece funções para medir e registrar o tempo de execução
 * de operações no frontend, ajudando a identificar gargalos de performance.
 */

import { createDebugger, DebugFunction } from './debugger';
import { DEBUG_CONFIG } from '../config/debug';

// Criar um debugger específico para performance
const performanceDebug = createDebugger('performance');

/**
 * Mede o tempo de execução de uma função síncrona
 * 
 * @param name - Nome da operação sendo medida
 * @param fn - Função a ser executada
 * @param threshold - Limiar em ms para alertas (opcional)
 * @param debug - Função de debug a ser usada (opcional)
 * @returns O resultado da função executada
 * 
 * @example
 * const result = measure('calcularTotal', () => {
 *   // código a ser medido
 *   return total;
 * });
 */
export function measure<T>(
  name: string,
  fn: () => T,
  threshold?: number,
  debug?: DebugFunction
): T {
  const debugFn = debug || performanceDebug;
  const startTime = performance.now();
  
  try {
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logPerformance(name, duration, threshold, debugFn);
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    debugFn.error(`Erro ao executar '${name}' (${duration.toFixed(2)}ms): %o`, error);
    throw error;
  }
}

/**
 * Mede o tempo de execução de uma função assíncrona
 * 
 * @param name - Nome da operação sendo medida
 * @param fn - Função assíncrona a ser executada
 * @param threshold - Limiar em ms para alertas (opcional)
 * @param debug - Função de debug a ser usada (opcional)
 * @returns Uma Promise com o resultado da função executada
 * 
 * @example
 * const data = await measureAsync('carregarDados', async () => {
 *   // código assíncrono a ser medido
 *   return await api.getData();
 * });
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  threshold?: number,
  debug?: DebugFunction
): Promise<T> {
  const debugFn = debug || performanceDebug;
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logPerformance(name, duration, threshold, debugFn);
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    debugFn.error(`Erro ao executar '${name}' (${duration.toFixed(2)}ms): %o`, error);
    throw error;
  }
}

/**
 * Cria um decorator para medir o tempo de execução de métodos de classe
 * 
 * @param name - Nome da operação (opcional, usa o nome do método se não fornecido)
 * @param threshold - Limiar em ms para alertas (opcional)
 * @param debug - Função de debug a ser usada (opcional)
 * @returns Decorator para método
 * 
 * @example
 * class UserService {
 *   @measureMethod('buscarUsuário')
 *   async getUser(id: string) {
 *     // implementação
 *   }
 * }
 */
export function measureMethod(
  name?: string,
  threshold?: number,
  debug?: DebugFunction
): MethodDecorator {
  return function(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = name || String(propertyKey);
    const debugFn = debug || performanceDebug;
    
    descriptor.value = function(...args: unknown[]) {
      const startTime = performance.now();
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Se o resultado for uma Promise, tratar de forma assíncrona
        if (result instanceof Promise) {
          return result.then(
            (value) => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              logPerformance(methodName, duration, threshold, debugFn);
              
              return value;
            },
            (error) => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              debugFn.error(`Erro ao executar '${methodName}' (${duration.toFixed(2)}ms): %o`, error);
              throw error;
            }
          );
        }
        
        // Caso síncrono
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logPerformance(methodName, duration, threshold, debugFn);
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        debugFn.error(`Erro ao executar '${methodName}' (${duration.toFixed(2)}ms): %o`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Função auxiliar para registrar informações de performance
 */
function logPerformance(
  name: string,
  duration: number,
  threshold?: number,
  debug?: DebugFunction
): void {
  const debugFn = debug || performanceDebug;
  const thresholdValue = threshold || DEBUG_CONFIG.performanceThreshold.render;
  
  if (duration > thresholdValue) {
    debugFn.warn(`Performance: '${name}' levou ${duration.toFixed(2)}ms (acima do limiar de ${thresholdValue}ms)`);
  } else {
    debugFn.info(`Performance: '${name}' completado em ${duration.toFixed(2)}ms`);
  }
}