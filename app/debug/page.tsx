'use client';

import React, { useState, useEffect } from 'react';
import DebugPanel from '../../components/debug/DebugPanel';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, Cardtitulo } from '../../components/ui/card';

interface ApiTestResult {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  success: boolean;
  response?: any;
  error?: string;
  timestamp: number;
}

export default function DebugPage() {
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<ApiTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('/api/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');

  // Logar quando a página é montada
  useEffect(() => {
    console.log('🔧 Página de debug carregada');
  }, []);

  // Função para testar uma API
  const testApi = async () => {
    if (!testUrl.trim()) {
      console.error('❌ URL de teste não pode estar vazia');
      return;
    }

    setIsTesting(true);
    const startTime = performance.now();
    const timestamp = Date.now();
    const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🔍 Testando API: ${testMethod} ${testUrl}`);

      const options: RequestInit = {
        method: testMethod,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (testMethod !== 'GET' && testBody.trim()) {
        try {
          options.body = testBody;
        } catch (error) {
          console.error('❌ Erro ao parsear corpo da requisição', error);
        }
      }

      const response = await fetch(testUrl, options);
      const duration = performance.now() - startTime;

      let responseData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (error) {
        responseData = 'Erro ao ler resposta';
      }

      const result: ApiTestResult = {
        id,
        url: testUrl,
        method: testMethod,
        status: response.status,
        duration,
        success: response.ok,
        response: responseData,
        timestamp
      };

      setApiTestResults(prev => [result, ...prev.slice(0, 49)]); // Manter apenas os últimos 50

      if (response.ok) {
        console.log(`✅ API ${testMethod} ${testUrl} - Sucesso (${duration.toFixed(2)}ms)`);
      } else {
        console.error(`❌ API ${testMethod} ${testUrl} - Erro ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      const result: ApiTestResult = {
        id,
        url: testUrl,
        method: testMethod,
        status: 0,
        duration,
        success: false,
        error: error.message || 'Erro desconhecido',
        timestamp
      };

      setApiTestResults(prev => [result, ...prev.slice(0, 49)]);
      console.error(`❌ Erro ao testar API: ${testMethod} ${testUrl}`, error);
    } finally {
      setIsTesting(false);
    }
  };

  // Função para limpar resultados
  const clearResults = () => {
    setApiTestResults([]);
    console.log('🧹 Resultados de teste limpos');
  };

  // Função para exportar resultados
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalTests: apiTestResults.length,
      results: apiTestResults
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📁 Resultados de teste exportados');
  };

  // Função para obter estatísticas do interceptor
  const getInterceptorStats = () => {
    if (typeof window !== 'undefined' && (window as any).apiInterceptor) {
      return (window as any).apiInterceptor.getStats();
    }
    return null;
  };

  const stats = getInterceptorStats();

  return (
    <div className="container-padding py-8 space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Cardtitulo>Debug Dashboard</Cardtitulo>
              <p className="text-muted-foreground mt-2">
                Ferramentas para debug e teste de conexões com o backend
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
                variant="outline"
              >
                {isDebugPanelVisible ? 'Esconder' : 'Mostrar'} Painel Debug
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Recarregar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Painel de Teste de API */}
        <Card>
          <CardHeader>
            <Cardtitulo>Teste de API</Cardtitulo>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL da API
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="/api/health"
                className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Método
                </label>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  &nbsp;
                </label>
                <Button
                  onClick={testApi}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? 'Testando...' : 'Testar API'}
                </Button>
              </div>
            </div>

            {testMethod !== 'GET' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Corpo da Requisição (JSON)
                </label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-sm"
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <Button
                onClick={clearResults}
                variant="destructive"
                size="sm"
              >
                Limpar Resultados
              </Button>
              <Button
                onClick={exportResults}
                variant="outline"
                size="sm"
              >
                Exportar Resultados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <Cardtitulo>Estatísticas</Cardtitulo>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total de Chamadas</div>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                  <div className="text-sm text-muted-foreground">Sucessos</div>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-secondary-foreground">{stats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
                <div className="bg-yellow-500/10 p-4 rounded-lg border col-span-2">
                  <div className="text-2xl font-bold text-yellow-600">{stats.avgDuration}ms</div>
                  <div className="text-sm text-muted-foreground">Tempo Médio de Resposta</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma estatística disponível
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Comandos Úteis</h3>
              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  apiInterceptor.getCalls()
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  apiInterceptor.getCallsByFilter(&#123;hasError: true&#125;)
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  apiInterceptor.exportCalls()
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  debugHelpers.showHelp()
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados dos Testes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Cardtitulo>
              Resultados dos Testes ({apiTestResults.length})
            </Cardtitulo>
            {apiTestResults.length > 0 && (
              <Button
                onClick={clearResults}
                variant="destructive"
                size="sm"
              >
                Limpar Todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {apiTestResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum teste executado ainda
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {apiTestResults.map((result) => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 ${
                    result.success 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                        result.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {result.method}
                      </span>
                      <span className="font-mono text-foreground">{result.url}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${
                        result.success ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="ml-2 font-medium">{result.duration.toFixed(2)}ms</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Resultado:</span>
                      <span className={`ml-2 font-medium ${
                        result.success ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {result.success ? 'Sucesso' : 'Erro'}
                      </span>
                    </div>
                  </div>

                  {(result.response || result.error) && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-primary hover:text-primary/80 font-medium">
                        Ver {result.response ? 'Resposta' : 'Erro'}
                      </summary>
                      <pre className="mt-2 text-sm bg-muted p-3 rounded border overflow-x-auto">
                        {JSON.stringify(result.response || result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel de Debug Flutuante */}
      <DebugPanel
        isVisible={isDebugPanelVisible}
        onToggle={setIsDebugPanelVisible}
        maxEntries={200}
      />
    </div>
  );
} 