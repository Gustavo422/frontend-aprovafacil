'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createDebugger } from '../../utils/debugger';

interface DebugData {
  id: string;
  timestamp: number;
  type: 'api' | 'component' | 'state' | 'error' | 'info';
  title: string;
  data: any;
  metadata?: {
    url?: string;
    method?: string;
    status?: number;
    duration?: number;
    component?: string;
  };
}

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  maxEntries?: number;
  autoScroll?: boolean;
}

const debug = createDebugger('debug-panel');

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isVisible = false,
  onToggle,
  maxEntries = 100,
  autoScroll = true
}) => {
  const [debugData, setDebugData] = useState<DebugData[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);

  // Função para adicionar dados de debug
  const addDebugData = useCallback((data: Omit<DebugData, 'id' | 'timestamp'>) => {
    const newEntry: DebugData = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setDebugData(prev => {
      const updated = [newEntry, ...prev].slice(0, maxEntries);
      return updated;
    });

    debug.info(`Novo dado de debug adicionado: ${data.title}`);
  }, [maxEntries]);

  // Função para limpar dados
  const clearData = useCallback(() => {
    setDebugData([]);
    debug.info('Dados de debug limpos');
  }, []);

  // Função para exportar dados
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(debugData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    debug.info('Dados de debug exportados');
  }, [debugData]);

  // Filtrar dados
  const filteredData = debugData.filter(entry => {
    const matchesFilter = filter === 'all' || entry.type === filter;
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(entry.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Auto-scroll para o final
  useEffect(() => {
    if (autoScroll && debugData.length > 0) {
      const panel = document.getElementById('debug-panel-content');
      if (panel) {
        panel.scrollTop = 0;
      }
    }
  }, [debugData, autoScroll]);

  // Expor função globalmente para uso em outros componentes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addDebugData = addDebugData;
      (window as any).clearDebugData = clearData;
      (window as any).exportDebugData = exportData;
    }
  }, [addDebugData, clearData, exportData]);

  // Função para obter cor baseada no tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api':
        return 'bg-blue-500';
      case 'component':
        return 'bg-green-500';
      case 'state':
        return 'bg-purple-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-yellow-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  // Função para formatar timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Função para formatar dados
  const formatData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 rounded-xl border bg-card text-card-foreground shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">Debug Panel</h3>
          <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
            {filteredData.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2 mb-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Todos</option>
                <option value="api">API</option>
                <option value="component">Componente</option>
                <option value="state">Estado</option>
                <option value="error">Erro</option>
                <option value="info">Info</option>
              </select>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearData}
                className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={exportData}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Exportar
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            id="debug-panel-content"
            className="max-h-64 overflow-y-auto p-4 space-y-2"
          >
            {filteredData.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                Nenhum dado de debug encontrado
              </div>
            ) : (
              filteredData.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-3 text-sm bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getTypeColor(entry.type)}`} />
                      <span className="font-medium">{entry.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  
                  {entry.metadata && (
                    <div className="text-xs text-muted-foreground mb-2 space-y-1">
                      {entry.metadata.url && (
                        <div>URL: {entry.metadata.url}</div>
                      )}
                      {entry.metadata.method && (
                        <div>Método: {entry.metadata.method}</div>
                      )}
                      {entry.metadata.status && (
                        <div>Status: {entry.metadata.status}</div>
                      )}
                      {entry.metadata.duration && (
                        <div>Duração: {entry.metadata.duration}ms</div>
                      )}
                      {entry.metadata.component && (
                        <div>Componente: {entry.metadata.component}</div>
                      )}
                    </div>
                  )}
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-primary hover:text-primary/80">
                      Ver dados
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded border overflow-x-auto">
                      {formatData(entry.data)}
                    </pre>
                  </details>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel; 