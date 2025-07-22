/**
 * Exemplo de uso das ferramentas de debug em um componente React
 */

'use client';

import { useState, useEffect } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import { measure, measureAsync } from '../../utils/performance-debug';
import { debugFetch } from '../../utils/api-debug';

// Criar um debugger específico para este componente
const debug = createModuleDebugger('component', 'debugExample');

export default function DebugExample() {
  type PostData = { title: string; body: string };
  const [data, setData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Exemplo de uso do debug em um efeito
  useEffect(() => {
    debug.info('Componente DebugExample montado');
    
    // Exemplo de medição de performance
    const cleanup = measure('setupDebugExample', () => {
      debug('Configurando listeners e recursos');
      
      // Simulação de alguma configuração
      const timeout = setTimeout(() => {
        debug('Recurso inicializado');
      }, 100);
      
      // Retornar função de limpeza
      return () => {
        debug('Limpando recursos');
        clearTimeout(timeout);
      };
    });
    
    // Função de limpeza do useEffect
    return () => {
      debug.info('Componente DebugExample desmontado');
      cleanup();
    };
  }, []);
  
  // Exemplo de uso do debug em uma função assíncrona
  const fetchData = async () => {
    debug.info('Iniciando busca de dados');
    setLoading(true);
    setError(null);
    
    try {
      // Usar measureAsync para medir o tempo da operação
      const result = await measureAsync('fetchExampleData', async () => {
        // Usar debugFetch para registrar detalhes da requisição
        const response = await debugFetch('https://jsonplaceholder.typicode.com/posts/1');
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        return await response.json();
      });
      
      debug.info('Dados recebidos com sucesso');
      debug.debug('Dados: %o', result);
      setData(result as PostData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      debug.error('Erro ao buscar dados: %s', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Exemplo de uso do debug em um manipulador de eventos
  const handleButtonClick = () => {
    debug('Botão clicado');
    fetchData();
  };
  
  // Registrar cada renderização
  debug('Renderizando DebugExample');
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Debug</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de debug.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:*&apos;</code> para ver os logs.
      </p>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? 'Carregando...' : 'Buscar Dados'}
      </button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          Erro: {error}
        </div>
      )}
      
      {data && (
        <div className="mt-4 p-2 bg-green-100 rounded">
          <h3 className="font-bold">{data.title}</h3>
          <p>{data.body}</p>
        </div>
      )}
    </div>
  );
}