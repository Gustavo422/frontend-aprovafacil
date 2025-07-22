/**
 * Exemplo de uso das ferramentas de debug com hooks personalizados
 */

'use client';

import { useState } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import { useDebugExample } from '../../hooks/useDebugExample';

// Criar um debugger específico para este componente
const debug = createModuleDebugger('component', 'hookDebugExample');

export default function HookDebugExample() {
  const [options, setOptions] = useState({
    initialCount: 0,
    autoIncrement: false,
    incrementInterval: 1000,
    maxCount: 10
  });
  
  // Usar o hook de exemplo com debug
  const {
    count,
    isRunning,
    error,
    increment,
    decrement,
    reset,
    start,
    stop,
    fetchRandomNumber
  } = useDebugExample(options);
  
  // Manipulador para alterar opções
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    debug.debug(`Opção alterada: ${name} = ${type === 'checkbox' ? checked : value}`);
    
    setOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };
  
  // Manipulador para buscar número aleatório
  const handleFetchRandom = async () => {
    debug('Botão de número aleatório clicado');
    
    try {
      await fetchRandomNumber();
    } catch {
      debug.error('Erro capturado no componente');
    }
  };
  
  // Registrar cada renderização
  debug('Renderizando HookDebugExample');
  debug.debug(`Estado atual: count=${count}, isRunning=${isRunning}`);
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Debug com Hooks</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de debug com hooks personalizados.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:hook:*,app:frontend:component:hookDebugExample&apos;</code> para ver os logs.
      </p>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">Configurações</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Valor Inicial:</label>
            <input
              type="number"
              name="initialCount"
              value={options.initialCount}
              onChange={handleOptionChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Intervalo (ms):</label>
            <input
              type="number"
              name="incrementInterval"
              value={options.incrementInterval}
              onChange={handleOptionChange}
              min="100"
              step="100"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Valor Máximo:</label>
            <input
              type="number"
              name="maxCount"
              value={options.maxCount}
              onChange={handleOptionChange}
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoIncrement"
              name="autoIncrement"
              checked={options.autoIncrement}
              onChange={handleOptionChange}
              className="mr-2"
            />
            <label htmlFor="autoIncrement">Incremento Automático</label>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Aplicar Configurações
          </button>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="text-4xl font-bold mb-4">{count}</div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={decrement}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decrementar
          </button>
          
          <button
            onClick={increment}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Incrementar
          </button>
          
          <button
            onClick={handleFetchRandom}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Número Aleatório
          </button>
        </div>
        
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={start}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Iniciar Auto
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Parar Auto
            </button>
          )}
          
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Resetar
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          Erro: {error}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Informações de Debug</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contador: <code>{count}</code></li>
          <li>Auto Incremento: <code>{isRunning ? 'Ativo' : 'Inativo'}</code></li>
          <li>Intervalo: <code>{options.incrementInterval}ms</code></li>
          <li>Valor Máximo: <code>{options.maxCount}</code></li>
        </ul>
      </div>
    </div>
  );
}