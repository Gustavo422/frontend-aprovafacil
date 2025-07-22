/**
 * Página de exemplos de debug
 * 
 * Esta página reúne todos os exemplos de uso das ferramentas de debug
 * para demonstrar as diferentes categorias e funcionalidades.
 */

'use client';

import { useState } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import DebugExample from './DebugExample';
import PerformanceExample from './PerformanceExample';
import FormDebugExample from './FormDebugExample';
import StateDebugExample from './StateDebugExample';
import RouterDebugExample from './RouterDebugExample';
import HookDebugExample from './HookDebugExample';

// Criar um debugger específico para esta página
const debug = createModuleDebugger('component', 'debugExamplesPage');

// Tipos de exemplos disponíveis
type ExampleType = 'basic' | 'performance' | 'form' | 'state' | 'router' | 'hook';

export default function DebugExamplesPage() {
  const [activeExample, setActiveExample] = useState<ExampleType>('basic');

  // Registrar mudanças de exemplo
  const handleExampleChange = (example: ExampleType) => {
    debug.info(`Alterando para exemplo: ${example}`);
    setActiveExample(example);
  };

  // Registrar cada renderização
  debug('Renderizando DebugExamplesPage');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Exemplos de Debug</h1>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Como usar o Debug</h2>
        <p className="mb-4">
          Para ativar o debug no navegador, abra o console do navegador (F12) e execute:
        </p>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto mb-4">
          localStorage.debug = &apos;app:frontend:*&apos;
        </pre>

        <p className="mb-2">Para ativar apenas categorias específicas:</p>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto mb-4">
          localStorage.debug = &apos;app:frontend:component:*,app:frontend:api:*&apos;
        </pre>

        <p className="mb-2">Ou use os helpers disponíveis:</p>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
          debugHelpers.enableDebug(&apos;app:frontend:*&apos;)<br />
          debugHelpers.showDebugHelp()
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Selecione um exemplo:</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExampleChange('basic')}
            className={`px-4 py-2 rounded ${activeExample === 'basic'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Básico
          </button>

          <button
            onClick={() => handleExampleChange('performance')}
            className={`px-4 py-2 rounded ${activeExample === 'performance'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Performance
          </button>

          <button
            onClick={() => handleExampleChange('form')}
            className={`px-4 py-2 rounded ${activeExample === 'form'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Formulário
          </button>

          <button
            onClick={() => handleExampleChange('state')}
            className={`px-4 py-2 rounded ${activeExample === 'state'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Estado
          </button>

          <button
            onClick={() => handleExampleChange('router')}
            className={`px-4 py-2 rounded ${activeExample === 'router'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Rotas
          </button>

          <button
            onClick={() => handleExampleChange('hook')}
            className={`px-4 py-2 rounded ${activeExample === 'hook'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Hooks
          </button>
        </div>
      </div>

      <div className="mb-8">
        {activeExample === 'basic' && <DebugExample />}
        {activeExample === 'performance' && <PerformanceExample />}
        {activeExample === 'form' && <FormDebugExample />}
        {activeExample === 'state' && <StateDebugExample />}
        {activeExample === 'router' && <RouterDebugExample />}
        {activeExample === 'hook' && <HookDebugExample />}
        <span>{'Exemplo n&atilde;o encontrado'}</span>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Categorias de Debug Disponíveis</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>app:frontend:component:*</code> - Logs de componentes</li>
          <li><code>app:frontend:hook:*</code> - Logs de hooks</li>
          <li><code>app:frontend:service:*</code> - Logs de serviços</li>
          <li><code>app:frontend:state:*</code> - Logs de gerenciamento de estado</li>
          <li><code>app:frontend:router:*</code> - Logs de rotas e navegação</li>
          <li><code>app:frontend:api:*</code> - Logs de requisições de API</li>
          <li><code>app:frontend:auth:*</code> - Logs de autenticação</li>
          <li><code>app:frontend:render:*</code> - Logs de renderização</li>
          <li><code>app:frontend:cache:*</code> - Logs de cache</li>
          <li><code>app:frontend:system:*</code> - Logs de sistema</li>
          <li><code>app:frontend:performance:*</code> - Logs de performance</li>
          <li><code>app:frontend:validation:*</code> - Logs de validação</li>
        </ul>
      </div>
    </div>
  );
}