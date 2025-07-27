'use client';

import React, { useState, useEffect } from 'react';
import { useDebug } from '../../hooks/useDebug';

interface RawDataViewerProps {
  data: any;
  title?: string;
  componentName?: string;
  showTimestamp?: boolean;
  maxHeight?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showCopyButton?: boolean;
  showExportButton?: boolean;
  className?: string;
}

export const RawDataViewer: React.FC<RawDataViewerProps> = ({
  data,
  title = 'Dados Brutos',
  componentName,
  showTimestamp = true,
  maxHeight = '400px',
  collapsible = true,
  defaultCollapsed = false,
  showCopyButton = true,
  showExportButton = true,
  className = ''
}) => {
  const { logInfo } = useDebug({ componentName });
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [timestamp] = useState(new Date().toISOString());
  const [copySuccess, setCopySuccess] = useState(false);

  // Logar quando os dados mudam
  useEffect(() => {
    if (componentName) {
      logInfo(`${title} atualizado`, { data, timestamp });
    }
  }, [data, title, componentName, logInfo, timestamp]);

  const formatData = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const copyToClipboard = async () => {
    try {
      const formattedData = formatData(data);
      await navigator.clipboard.writeText(formattedData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      logInfo('Dados copiados para clipboard');
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
    }
  };

  const exportData = () => {
    try {
      const exportData = {
        title,
        componentName,
        timestamp,
        data
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${componentName || 'data'}-${new Date().toISOString().slice(0, 19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      logInfo('Dados exportados');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  const getDataSize = (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      const bytes = new Blob([jsonString]).size;
      
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'N/A';
    }
  };

  const getDataType = (data: any): string => {
    if (data === null) return 'null';
    if (Array.isArray(data)) return `array[${data.length}]`;
    if (typeof data === 'object') return 'object';
    return typeof data;
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {componentName && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {componentName}
            </span>
          )}
          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
            {getDataType(data)}
          </span>
          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
            {getDataSize(data)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {showTimestamp && (
            <span className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          
          {showCopyButton && (
            <button
              onClick={copyToClipboard}
              className={`p-1 rounded text-xs ${
                copySuccess 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Copiar dados"
            >
              {copySuccess ? '✓' : '📋'}
            </button>
          )}
          
          {showExportButton && (
            <button
              onClick={exportData}
              className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Exportar dados"
            >
              📁
            </button>
          )}
          
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              title={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          <pre 
            className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto"
            style={{ maxHeight }}
          >
            {formatData(data)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Hook para usar o visualizador de dados brutos
export function useRawDataViewer(componentName?: string) {
  const { logInfo } = useDebug({ componentName });

  const logRawData = (data: any, title?: string) => {
    logInfo(`${title || 'Dados brutos'}`, data);
  };

  const RawDataViewerComponent = React.memo(({ 
    data, 
    title = 'Dados Brutos',
    ...props 
  }: Omit<RawDataViewerProps, 'componentName'>) => (
    <RawDataViewer
      data={data}
      title={title}
      componentName={componentName}
      {...props}
    />
  ));

  return {
    logRawData,
    RawDataViewer: RawDataViewerComponent
  };
}

export default RawDataViewer; 