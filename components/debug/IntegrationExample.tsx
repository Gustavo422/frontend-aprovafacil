'use client';

import React, { useState, useEffect } from 'react';
import { useDebug } from '../../hooks/useDebug';
import { RawDataViewer, useRawDataViewer } from './RawDataViewer';
import DebugButton from './DebugButton';

// Exemplo de como integrar debug em um componente existente
// Este é um exemplo de um componente que busca dados de concursos

interface Concurso {
  id: number;
  nome: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

interface IntegrationExampleProps {
  userId?: number;
  showDebug?: boolean;
}

export const IntegrationExample: React.FC<IntegrationExampleProps> = ({
  userId,
  showDebug = true
}) => {
  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 1: Importar e configurar o hook
  const { logInfo, logError, logApiCall, logState } = useDebug({ 
    componentName: 'IntegrationExample',
    autoLogProps: true, // Log automático das props
    autoLogState: true  // Log automático das mudanças de estado
  });

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 2: Configurar visualizador de dados
  const { RawDataViewer } = useRawDataViewer('IntegrationExample');

  // Estados do componente
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConcurso, setSelectedConcurso] = useState<Concurso | null>(null);

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 3: Logar quando o componente é montado
  useEffect(() => {
    logInfo('Componente IntegrationExample montado', { userId, showDebug });
  }, [userId, showDebug, logInfo]);

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 4: Logar mudanças de estado
  useEffect(() => {
    logState(concursos, 'concursos');
  }, [concursos, logState]);

  useEffect(() => {
    logState(loading, 'loading');
  }, [loading, logState]);

  useEffect(() => {
    logState(error, 'error');
  }, [error, logState]);

  useEffect(() => {
    logState(selectedConcurso, 'selectedConcurso');
  }, [selectedConcurso, logState]);

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 5: Função com debug completo
  const fetchConcursos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Logar início da operação
      logInfo('Iniciando busca de concursos', { userId });
      
      const startTime = performance.now();
      const response = await fetch('/api/concursos');
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 6: Logar chamada de API
      logApiCall('/api/concursos', 'GET', undefined, data, response.status, duration);
      
      setConcursos(data);
      logInfo('Concursos carregados com sucesso', { 
        count: data.length, 
        duration: `${duration.toFixed(2)}ms` 
      });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido';
      setError(errorMessage);
      
      // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 7: Logar erros
      logError(err, 'fetchConcursos');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 8: Função com tratamento de erro
  const createConcurso = async (concursoData: Omit<Concurso, 'id'>) => {
    try {
      logInfo('Criando novo concurso', concursoData);
      
      const startTime = performance.now();
      const response = await fetch('/api/concursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(concursoData),
      });
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }
      
      const newConcurso = await response.json();
      
      // Logar chamada de API
      logApiCall('/api/concursos', 'POST', concursoData, newConcurso, response.status, duration);
      
      setConcursos(prev => [...prev, newConcurso]);
      logInfo('Concurso criado com sucesso', newConcurso);
      
    } catch (err: any) {
      logError(err, 'createConcurso');
      throw err; // Re-throw para o componente pai tratar se necessário
    }
  };

  // 🔧 INTEGRAÇÃO DO DEBUG - PASSO 9: Função para simular erro
  const simulateError = () => {
    try {
      throw new Error('Erro simulado para teste de debug');
    } catch (err: any) {
      logError(err, 'simulateError');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* 🔧 INTEGRAÇÃO DO DEBUG - PASSO 10: Adicionar botão de debug */}
      {showDebug && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Exemplo de Integração</h2>
          <DebugButton position="top-right" />
        </div>
      )}

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={fetchConcursos}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Buscar Concursos'}
        </button>
        
        <button
          onClick={() => createConcurso({ 
            nome: 'Novo Concurso', 
            status: 'ativo', 
            dataInicio: '2024-01-01', 
            dataFim: '2024-12-31' 
          })}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Criar Concurso
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
            <div className="text-sm font-medium text-blue-800">Concursos</div>
            <div className="text-2xl font-bold text-blue-600">{concursos.length}</div>
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
              {selectedConcurso ? 'Sim' : 'Não'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de concursos */}
      {concursos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Concursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concursos.map((concurso) => (
              <div
                key={concurso.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedConcurso?.id === concurso.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedConcurso(concurso)}
              >
                <div className="font-medium text-gray-900">{concurso.nome}</div>
                <div className="text-sm text-gray-600">Status: {concurso.status}</div>
                <div className="text-xs text-gray-500">
                  {concurso.dataInicio} - {concurso.dataFim}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔧 INTEGRAÇÃO DO DEBUG - PASSO 11: Adicionar visualizadores de dados */}
      {showDebug && (
        <div className="space-y-4">
          <RawDataViewer
            data={concursos}
            title="Dados dos Concursos"
            defaultCollapsed={true}
          />
          
          {selectedConcurso && (
            <RawDataViewer
              data={selectedConcurso}
              title="Concurso Selecionado"
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
      )}

      {/* Instruções de integração */}
      {showDebug && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Como integrar debug em seu componente:
          </h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Importe o hook: <code className="bg-gray-200 px-1 rounded">useDebug</code></li>
            <li>Configure o hook com o nome do componente</li>
            <li>Loge quando o componente é montado</li>
            <li>Loge mudanças de estado importantes</li>
            <li>Loge chamadas de API com tempo de resposta</li>
            <li>Loge erros com contexto</li>
            <li>Adicione visualizadores de dados brutos</li>
            <li>Use o botão de debug para controles rápidos</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default IntegrationExample; 