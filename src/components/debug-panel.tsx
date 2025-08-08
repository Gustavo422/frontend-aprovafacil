import React, { useState } from 'react';
import { useDebug, useHttpDebug } from '../hooks/useDebug.js';

interface DebugPanelProps {
  className?: string;
}

export function DebugPanel({ className = '' }: DebugPanelProps) {
  const { isDebugMode, debugInfo, toggleDebug, clearStats } = useDebug();
  const httpStats = useHttpDebug();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDebugMode && !debugInfo.isEnabled) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Botão de toggle */}
      <button
        onClick={toggleDebug}
        className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
          isDebugMode
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isDebugMode ? '🔴 DEBUG ON' : '🟢 DEBUG OFF'}
      </button>

      {/* Painel expandido */}
      {isDebugMode && (
        <div className="mt-2 bg-black bg-opacity-90 text-white p-4 rounded-lg font-mono text-xs max-w-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🔍 Debug Panel</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1 bg-gray-700 rounded text-xs"
              >
                {isExpanded ? '−' : '+'}
              </button>
              <button
                onClick={clearStats}
                className="px-2 py-1 bg-gray-700 rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            
            <div className="flex justify-between">
              <span>Started:</span>
              <span>{new Date(debugInfo.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="flex justify-between">
              <span>Requests:</span>
              <span className="text-blue-400">{httpStats.requests}</span>
            </div>

            <div className="flex justify-between">
              <span>Responses:</span>
              <span className="text-green-400">{httpStats.responses}</span>
            </div>

            <div className="flex justify-between">
              <span>Errors:</span>
              <span className="text-red-400">{httpStats.errors}</span>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="space-y-1">
                  <div className="text-xs text-gray-400">Last Request:</div>
                  <div className="text-xs break-all">
                    {httpStats.lastRequest ? (
                      <span className="text-blue-300">
                        {httpStats.lastRequest.timestamp}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">Last Response:</div>
                  <div className="text-xs break-all">
                    {httpStats.lastResponse ? (
                      <span className="text-green-300">
                        {httpStats.lastResponse.timestamp}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">Last Error:</div>
                  <div className="text-xs break-all">
                    {httpStats.lastError ? (
                      <span className="text-red-300">
                        {httpStats.lastError.timestamp}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Debug Info:</div>
                  <div className="text-xs space-y-1">
                    <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                    <div>User Agent: {typeof navigator !== 'undefined' ? `${navigator.userAgent.substring(0, 50) }...` : 'N/A'}</div>
                    <div>Screen: {typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
            Press F12 to see detailed logs
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de debug flutuante
export function FloatingDebugButton() {
  const { isDebugMode, toggleDebug } = useDebug();

  return (
    <button
      onClick={toggleDebug}
      className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full font-mono text-xs font-bold transition-all duration-200 shadow-lg ${
        isDebugMode
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white'
      }`}
      title={isDebugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
    >
      {isDebugMode ? '🔴' : '🟢'}
    </button>
  );
}

export default DebugPanel; 