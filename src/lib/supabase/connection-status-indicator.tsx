'use client';

import React from 'react';
import { useConnectionStatus } from './use-connection-status';

interface ConnectionStatusIndicatorProps {
  showLabel?: boolean;
  showReconnectButton?: boolean;
  className?: string;
}

/**
 * Component to display the current Supabase connection status
 */
export function ConnectionStatusIndicator({
  showLabel = true,
  showReconnectButton = true,
  className = ''
}: ConnectionStatusIndicatorProps) {
  const { isConnected, isConnecting, isError, isOnline, resetConnection } = useConnectionStatus();
  
  // Determine color based on status
  let color = 'gray';
  if (isConnected) color = 'green';
  if (isConnecting) color = 'yellow';
  if (isError) color = 'red';
  if (!isOnline) color = 'red';
  
  // Determine label based on status
  let label = 'Desconectado';
  if (isConnected) label = 'Conectado';
  if (isConnecting) label = 'Conectando...';
  if (isError) label = 'Erro de conex�o';
  if (!isOnline) label = 'Offline';
  
  // Handle reconnect button click
  const handleReconnect = () => {
    resetConnection();
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {/* Status indicator */}
      <div
        className={`w-3 h-3 rounded-full bg-${color}-500`}
      />
      
      {/* Status label */}
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600">{label}</span>
      )}
      
      {/* Reconnect button */}
      {showReconnectButton && (isError || !isOnline) && (
        <button
          onClick={handleReconnect}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reconectar
        </button>
      )}
    </div>
  );
}

export default ConnectionStatusIndicator;
