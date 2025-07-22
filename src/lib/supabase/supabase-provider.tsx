'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { EnhancedSupabaseClient, getSupabaseClient } from './enhanced-client';
import { ConnectionStatus } from './enums/connection-status.enum';
import { SupabaseOptions } from './types/supabase-options.type';

// Context type
interface SupabaseContextType {
  client: EnhancedSupabaseClient;
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isError: boolean;
  resetConnection: () => Promise<void>;
}

// Create context with a default value
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider props
interface SupabaseProviderProps {
  children: React.ReactNode;
  supabaseUrl?: string;
  supabaseKey?: string;
  options?: SupabaseOptions;
}

/**
 * Provider component for Supabase client
 */
export function SupabaseProvider({
  children,
  supabaseUrl,
  supabaseKey,
  options
}: SupabaseProviderProps) {
  // Use environment variables if not provided
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Create client
  const client = getSupabaseClient(url, key, options);
  
  // Track connection status
  const [status, setStatus] = useState<ConnectionStatus>(client.getConnectionStatus());
  
  // Reset connection
  const resetConnection = async () => {
    await client.resetClient();
  };
  
  // Listen for status changes
  useEffect(() => {
    const unsubscribe = client.onConnectionStatusChange(setStatus);
    return unsubscribe;
  }, [client]);
  
  // Derived status flags
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING;
  const isError = status === ConnectionStatus.ERROR;
  
  // Context value
  const value: SupabaseContextType = {
    client,
    status,
    isConnected,
    isConnecting,
    isError,
    resetConnection
  };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook to use the Supabase client
 */
export function useSupabase() {
  const context = useContext(SupabaseContext);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  
  return context;
}
