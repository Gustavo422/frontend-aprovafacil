'use client';

import React, { useState, useEffect } from 'react';
import { useDebug } from '../../hooks/useDebug';
import DebugPanel from './DebugPanel';

interface DebugButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showStats?: boolean;
}

export const DebugButton: React.FC<DebugButtonProps> = ({
  position = 'bottom-right',
  showStats = true
}) => {
  const { logInfo, isDebugPanelVisible, toggleDebugPanel } = useDebug({ componentName: 'DebugButton' });
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Mostrar o botão apenas em desenvolvimento
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    if (!showStats) return;

    const updateStats = () => {
      if (typeof window !== 'undefined' && (window as any).apiInterceptor) {
        const currentStats = (window as any).apiInterceptor.getStats();
        setStats(currentStats);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [showStats]);

  // Atalho de teclado para alternar debug (Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        toggleDebugPanel();
        logInfo('Debug panel toggled via keyboard shortcut');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugPanel, logInfo]);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <>
      <div className={`fixed ${getPositionClasses()} z-40 flex flex-col items-end space-y-2`}>
        {/* Botão principal */}
        <button
          onClick={toggleDebugPanel}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
          title="Debug Panel (Ctrl+Shift+Z)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Estatísticas rápidas */}
        {showStats && stats && (
          <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-xs font-medium text-gray-700 mb-2">API Stats</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sucessos:</span>
                <span className="font-medium text-green-600">{stats.successful}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Erros:</span>
                <span className="font-medium text-red-600">{stats.errors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa:</span>
                <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Botões de ação rápida */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).clearDebugData) {
                (window as any).clearDebugData();
              }
              if (typeof window !== 'undefined' && (window as any).apiInterceptor) {
                (window as any).apiInterceptor.clearCalls();
              }
              logInfo('Dados de debug limpos');
            }}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Limpar Debug"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).exportDebugData) {
                (window as any).exportDebugData();
              }
              if (typeof window !== 'undefined' && (window as any).apiInterceptor) {
                const data = (window as any).apiInterceptor.exportCalls();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `api-calls-${new Date().toISOString().slice(0, 19)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }
              logInfo('Dados exportados');
            }}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Exportar Debug"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Painel de Debug */}
      <DebugPanel
        isVisible={isDebugPanelVisible}
        onToggle={toggleDebugPanel}
        maxEntries={200}
      />
    </>
  );
};

export default DebugButton; 