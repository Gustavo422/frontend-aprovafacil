/**
 * Exemplo de uso das ferramentas de debug com gerenciamento de estado
 */

'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { createModuleDebugger } from '../../utils/debugger';

// Criar debuggers específicos para este módulo
const stateDebug = createModuleDebugger('state', 'counterState');
const componentDebug = createModuleDebugger('component', 'stateDebug');

// Definir tipos para o estado
interface CounterState {
  count: number;
  lastOperation: string | null;
  history: number[];
}

// Definir tipos para as ações
type CounterAction = 
  | { type: 'INCREMENT'; payload?: number }
  | { type: 'DECREMENT'; payload?: number }
  | { type: 'RESET' }
  | { type: 'UNDO' };

// Estado inicial
const initialState: CounterState = {
  count: 0,
  lastOperation: null,
  history: []
};

// Criar o contexto
const CounterContext = createContext<{
  state: CounterState;
  dispatch: React.Dispatch<CounterAction>;
} | undefined>(undefined);

// Reducer com debug
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  stateDebug.info(`Ação disparada: ${action.type}`);
  stateDebug.debug('Estado atual: %o', state);
  
  let newState: CounterState;
  
  switch (action.type) {
    case 'INCREMENT': {
      const amount = action.payload || 1;
      stateDebug.debug(`Incrementando por ${amount}`);
      
      newState = {
        count: state.count + amount,
        lastOperation: `Incrementado por ${amount}`,
        history: [...state.history, state.count]
      };
      break;
    }
    
    case 'DECREMENT': {
      const amount = action.payload || 1;
      stateDebug.debug(`Decrementando por ${amount}`);
      
      newState = {
        count: state.count - amount,
        lastOperation: `Decrementado por ${amount}`,
        history: [...state.history, state.count]
      };
      break;
    }
    
    case 'RESET': {
      stateDebug.debug('Resetando contador');
      
      newState = {
        count: 0,
        lastOperation: 'Resetado',
        history: [...state.history, state.count]
      };
      break;
    }
    
    case 'UNDO': {
      if (state.history.length === 0) {
        stateDebug.warn('Tentativa de desfazer, mas não há histórico');
        return state;
      }
      
      stateDebug.debug('Desfazendo última operação');
      
      const newHistory = [...state.history];
      const previousCount = newHistory.pop() || 0;
      
      newState = {
        count: previousCount,
        lastOperation: 'Desfeito',
        history: newHistory
      };
      break;
    }
    
    default: {
      stateDebug.error(`Ação desconhecida: ${(action as { type: string }).type}`);
      return state;
    }
  }
  
  stateDebug.debug('Novo estado: %o', newState);
  return newState;
}

// Provider com debug
function CounterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(counterReducer, initialState);
  
  stateDebug('Provider renderizado com estado: %o', state);
  
  return (
    <CounterContext.Provider value={{ state, dispatch }}>
      {children}
    </CounterContext.Provider>
  );
}

// Hook para usar o contexto
function useCounter() {
  const context = useContext(CounterContext);
  
  if (context === undefined) {
    stateDebug.error('useCounter deve ser usado dentro de um CounterProvider');
    throw new Error('useCounter deve ser usado dentro de um CounterProvider');
  }
  
  return context;
}

// Componente de controle
function CounterControls() {
  const { state, dispatch } = useCounter();
  
  componentDebug('Renderizando CounterControls');
  
  const handleIncrement = () => {
    componentDebug('Botão de incremento clicado');
    dispatch({ type: 'INCREMENT' });
  };
  
  const handleIncrementBy5 = () => {
    componentDebug('Botão de incremento por 5 clicado');
    dispatch({ type: 'INCREMENT', payload: 5 });
  };
  
  const handleDecrement = () => {
    componentDebug('Botão de decremento clicado');
    dispatch({ type: 'DECREMENT' });
  };
  
  const handleReset = () => {
    componentDebug('Botão de reset clicado');
    dispatch({ type: 'RESET' });
  };
  
  const handleUndo = () => {
    componentDebug('Botão de desfazer clicado');
    dispatch({ type: 'UNDO' });
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold mb-4">Contador: {state.count}</div>
      
      {state.lastOperation && (
        <div className="mb-4 text-gray-600">
          Última operação: {state.lastOperation}
        </div>
      )}
      
      <div className="flex gap-2 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleIncrement}
        >
          +1
        </button>
        
        <button
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
          onClick={handleIncrementBy5}
        >
          +5
        </button>
        
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleDecrement}
        >
          -1
        </button>
        
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={handleReset}
        >
          Reset
        </button>
        
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={handleUndo}
          disabled={state.history.length === 0}
        >
          Desfazer
        </button>
      </div>
      
      <div className="text-sm text-gray-500">
        Histórico: {state.history.length} operações
      </div>
    </div>
  );
}

// Componente principal
export default function StateDebugExample() {
  componentDebug('Renderizando StateDebugExample');
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Debug com Estado</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de debug com gerenciamento de estado.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:state:*,app:frontend:component:stateDebug&apos;</code> para ver os logs.
      </p>
      
      <CounterProvider>
        <CounterControls />
      </CounterProvider>
    </div>
  );
}