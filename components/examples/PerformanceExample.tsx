/**
 * Exemplo de uso das ferramentas de performance em um componente React
 */

'use client';

import { useState } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import { measure, measureAsync } from '../../utils/performance-debug';

// Criar um debugger específico para este componente
const debug = createModuleDebugger('component', 'performanceExample');

// Função que simula uma operação pesada
function heavyComputation(iterations: number): number {
  debug.info(`Iniciando computação pesada com ${iterations} iterações`);
  
  return measure('heavyComputation', () => {
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sin(i) * Math.cos(i);
    }
    return result;
  });
}

// Função que simula uma operação assíncrona lenta
async function slowAsyncOperation(delay: number): Promise<string> {
  debug.info(`Iniciando operação assíncrona com delay de ${delay}ms`);
  
  return await measureAsync('slowAsyncOperation', async () => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Operação concluída após ${delay}ms`);
      }, delay);
    });
  });
}

export default function PerformanceExample() {
  const [syncResult, setSyncResult] = useState<number | null>(null);
  const [asyncResult, setAsyncResult] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    sync: false,
    async: false
  });
  
  // Manipulador para operação síncrona
  const handleSyncOperation = () => {
    debug('Botão de operação síncrona clicado');
    setLoading((prev) => ({ ...prev, sync: true }));
    
    // Usar setTimeout para não bloquear a UI imediatamente
    setTimeout(() => {
      try {
        const result = heavyComputation(10000000);
        debug.info(`Operação síncrona concluída com resultado: ${result}`);
        setSyncResult(result);
      } catch (error) {
        debug.error('Erro na operação síncrona: %o', error);
      } finally {
        setLoading((prev) => ({ ...prev, sync: false }));
      }
    }, 0);
  };
  
  // Manipulador para operação assíncrona
  const handleAsyncOperation = async () => {
    debug('Botão de operação assíncrona clicado');
    setLoading((prev) => ({ ...prev, async: true }));
    
    try {
      const result = await slowAsyncOperation(2000);
      debug.info(`Operação assíncrona concluída com resultado: ${result}`);
      setAsyncResult(result);
    } catch (error) {
      debug.error('Erro na operação assíncrona: %o', error);
    } finally {
      setLoading((prev) => ({ ...prev, async: false }));
    }
  };
  
  // Registrar cada renderização
  debug('Renderizando PerformanceExample');
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Performance</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de medição de performance.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:performance:*&apos;</code> para ver apenas os logs de performance.
      </p>
      
      <div className="flex flex-col gap-4">
        <div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSyncOperation}
            disabled={loading.sync}
          >
            {loading.sync ? 'Processando...' : 'Executar Operação Síncrona'}
          </button>
          
          {syncResult !== null && (
            <div className="mt-2">
              <strong>Resultado:</strong> {syncResult.toFixed(2)}
            </div>
          )}
        </div>
        
        <div>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleAsyncOperation}
            disabled={loading.async}
          >
            {loading.async ? 'Aguardando...' : 'Executar Operação Assíncrona'}
          </button>
          
          {asyncResult && (
            <div className="mt-2">
              <strong>Resultado:</strong> {asyncResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}