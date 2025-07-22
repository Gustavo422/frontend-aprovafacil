'use client';

import { useEffect, useState } from 'react';
import { ConnectionStatus } from './enums/connection-status.enum';
import { getConnectionMonitor } from './connection-monitor';
import { useSupabase } from './supabase-provider';
import type { ISupabaseClient } from './interfaces/supabase-client.interface';

/**
 * Hook for monitoring Supabase connection status
 */
export function useConnectionStatus() {
  const { client } = useSupabase();
  const [status, setStatus] = useState<ConnectionStatus>(client.getConnectionStatus());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Get connection monitor
  const connectionMonitor = getConnectionMonitor(client as unknown as ISupabaseClient);
  
  // Listen for connection status changes
  useEffect(() => {
    const unsubscribe = connectionMonitor.onConnectionChange(setStatus);
    
    return unsubscribe;
  }, [connectionMonitor]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Derived status flags
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING;
  const isError = status === ConnectionStatus.ERROR;
  const isDisconnected = status === ConnectionStatus.DISCONNECTED;
  
  // Reset connection function
  const resetConnection = async () => {
    await connectionMonitor.resetConnection();
  };
  
  return {
    status,
    isConnected,
    isConnecting,
    isError,
    isDisconnected,
    isOnline,
    resetConnection
  };
}

export default useConnectionStatus;
