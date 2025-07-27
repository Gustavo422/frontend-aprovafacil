'use client';

import React, { useState, useEffect } from 'react';
import { useDebug } from '../../hooks/useDebug';
import { useRawDataViewer } from './RawDataViewer';
import DebugButton from './DebugButton';

interface User {
  id: number;
  name: string;
  email: string;
}

export const DebugExample: React.FC = () => {
  const { logInfo, logError, logApiCall, logState, debug } = useDebug({ 
    componentName: 'DebugExample',
    autoLogProps: true,
    autoLogState: true
  });
  
  const { RawDataViewer } = useRawDataViewer('DebugExample');
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Logar quando o componente é montado
  useEffect(() => {
    logInfo('Componente DebugExample montado');
  }, [logInfo]);

  // Logar mudanças no estado
  useEffect(() => {
    logState(users, 'users');
  }, [users, logState]);

  useEffect(() => {
    logState(loading, 'loading');
  }, [loading, logState]);

  useEffect(() => {
    logState(error, 'error');
  }, [error, logState]);

  useEffect(() => {
    logState(selectedUser, 'selectedUser');
  }, [selectedUser, logState]);

  // Função para buscar usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logInfo('Iniciando busca de usuários');
      
      const startTime = performance.now();
      const response = await fetch('/api/users');
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Logar a chamada de API
      logApiCall('/api/users', 'GET', undefined, data, response.status, duration);
      
      setUsers(data);
      logInfo('Usuários carregados com sucesso', { count: data.length });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido';
      setError(errorMessage);
      logError(err, 'fetchUsers');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar usuário
  const createUser = async (userData: Omit<User, 'id'>) => {
    try {
      logInfo('Criando novo usuário', userData);
      
      const startTime = performance.now();
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newUser = await response.json();
      
      // Logar a chamada de API
      logApiCall('/api/users', 'POST', userData, newUser, response.status, duration);
      
      setUsers(prev => [...prev, newUser]);
      logInfo('Usuário criado com sucesso', newUser);
      
    } catch (err: any) {
      logError(err, 'createUser');
    }
  };

  // Função para simular erro
  const simulateError = () => {
    try {
      throw new Error('Erro simulado para teste de debug');
    } catch (err: any) {
      logError(err, 'simulateError');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Exemplo de Debug</h2>
        <DebugButton position="top-right" />
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Buscar Usuários'}
        </button>
        
        <button
          onClick={() => createUser({ name: 'Novo Usuário', email: 'novo@email.com' })}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Criar Usuário
        </button>
        
        <button
          onClick={simulateError}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Simular Erro
        </button>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Usuários</div>
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-800">Carregando</div>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? 'Sim' : 'Não'}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-800">Erro</div>
            <div className="text-2xl font-bold text-red-600">
              {error ? 'Sim' : 'Não'}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Selecionado</div>
            <div className="text-2xl font-bold text-green-600">
              {selectedUser ? 'Sim' : 'Não'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuários */}
      {users.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Usuários</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500">ID: {user.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualizador de dados brutos */}
      <div className="space-y-4">
        <RawDataViewer
          data={users}
          title="Dados dos Usuários"
          defaultCollapsed={true}
        />
        
        {selectedUser && (
          <RawDataViewer
            data={selectedUser}
            title="Usuário Selecionado"
            defaultCollapsed={false}
          />
        )}
        
        {error && (
          <RawDataViewer
            data={{ error, timestamp: new Date().toISOString() }}
            title="Erro Atual"
            defaultCollapsed={false}
          />
        )}
      </div>

      {/* Instruções */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Como usar o debug neste componente:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Clique no botão de debug no canto superior direito</li>
          <li>• Use Ctrl+Shift+Z para abrir o painel de debug</li>
          <li>• Execute as ações acima para ver logs em tempo real</li>
          <li>• Abra o console do navegador para ver logs detalhados</li>
          <li>• Use <code className="bg-gray-200 px-1 rounded">debugHelpers.showHelp()</code> no console</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugExample; 