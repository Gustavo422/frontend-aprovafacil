import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

/**
 * Status da conexão
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

/**
 * Evento de conexão
 */
export interface ConnectionEvent {
  status: ConnectionStatus;
  timestamp: Date;
  error?: Error;
  retryCount?: number;
}

/**
 * Opções do provider Supabase
 */
export interface SupabaseProviderOptions {
  /**
   * URL do Supabase
   */
  supabaseUrl?: string;
  
  /**
   * Chave anônima do Supabase
   */
  supabaseAnonKey?: string;
  
  /**
   * Intervalo de verificação de conexão em ms
   */
  healthCheckInterval?: number;
  
  /**
   * Número máximo de tentativas de reconexão
   */
  maxRetries?: number;
  
  /**
   * Delay inicial para reconexão em ms
   */
  retryDelay?: number;
  
  /**
   * Se deve tentar reconectar automaticamente
   */
  autoReconnect?: boolean;
}

/**
 * Contexto do Supabase
 */
interface SupabaseContextType {
  /**
   * Cliente Supabase
   */
  supabase: SupabaseClient | null;
  
  /**
   * Status da conexão
   */
  connectionStatus: ConnectionStatus;
  
  /**
   * Histórico de eventos de conexão
   */
  connectionEvents: ConnectionEvent[];
  
  /**
   * Se está conectado
   */
  isConnected: boolean;
  
  /**
   * Se está reconectando
   */
  isReconnecting: boolean;
  
  /**
   * Último erro de conexão
   */
  lastError: Error | null;
  
  /**
   * Forçar reconexão
   */
  reconnect: () => Promise<void>;
  
  /**
   * Verificar saúde da conexão
   */
  checkHealth: () => Promise<boolean>;
  
  /**
   * Limpar histórico de eventos
   */
  clearEvents: () => void;
}

// Contexto do Supabase
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

/**
 * Provider do Supabase
 */
export function SupabaseProvider({ 
  children, 
  options = {} 
}: { 
  children: ReactNode;
  options?: SupabaseProviderOptions;
}) {
  // Opções padrão
  const {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    healthCheckInterval = 30000, // 30 segundos
    maxRetries = 3,
    retryDelay = 1000,
    autoReconnect = true
  } = options;
  
  // Estado
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTING);
  const [connectionEvents, setConnectionEvents] = useState<ConnectionEvent[]>([]);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Hook de autenticação
  const { token } = useAuth();
  
  // Adicionar evento de conexão
  const addConnectionEvent = useCallback((status: ConnectionStatus, error?: Error, retryCount?: number) => {
    const event: ConnectionEvent = {
      status,
      timestamp: new Date(),
      error,
      retryCount
    };
    setConnectionEvents(prev => [...prev.slice(-9), event]); // Manter apenas os últimos 10 eventos
    setConnectionStatus(status);
    if (error) {
      setLastError(error);
    } else if (status === ConnectionStatus.CONNECTED) {
      setLastError(null);
      setRetryCount(0);
    }
  }, [setConnectionEvents, setConnectionStatus, setLastError, setRetryCount]);
  
  // Criar cliente Supabase
  const createSupabaseClient = useCallback(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error('Supabase URL e chave anônima são obrigatórias');
      addConnectionEvent(ConnectionStatus.ERROR, error);
      return null;
    }
    
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      
      return client;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao criar cliente Supabase');
      addConnectionEvent(ConnectionStatus.ERROR, err);
      return null;
    }
  }, [supabaseUrl, supabaseAnonKey, addConnectionEvent]);
  
  // Verificar saúde da conexão
  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;
    
    try {
      // Fazer uma query simples para testar a conexão
      const { error } = await supabase
        .from('usuarios')
        .select('count')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 é "no rows returned"
        throw error;
      }
      
      if (connectionStatus !== ConnectionStatus.CONNECTED) {
        addConnectionEvent(ConnectionStatus.CONNECTED, undefined);
      }
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro na verificação de saúde');
      addConnectionEvent(ConnectionStatus.ERROR, err);
      return false;
    }
  }, [supabase, connectionStatus, addConnectionEvent]);
  
  // Reconectar
  const reconnect = useCallback(async (): Promise<void> => {
    if (retryCount >= maxRetries) {
      addConnectionEvent(ConnectionStatus.ERROR, new Error('Número máximo de tentativas excedido'));
      return;
    }
    
    addConnectionEvent(ConnectionStatus.RECONNECTING, undefined, retryCount + 1);
    setRetryCount(prev => prev + 1);
    
    // Aguardar delay
    await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    
    // Criar novo cliente
    const newClient = createSupabaseClient();
    if (newClient) {
      setSupabase(newClient);
      
      // Verificar saúde
      const isHealthy = await checkHealth();
      if (!isHealthy && autoReconnect) {
        // Tentar novamente
        setTimeout(async () => reconnect(), retryDelay * (retryCount + 1));
      }
    }
  }, [retryCount, maxRetries, addConnectionEvent, retryDelay, createSupabaseClient, checkHealth, autoReconnect, setSupabase]);
  
  // Limpar eventos
  const clearEvents = () => {
    setConnectionEvents([]);
  };
  
  // Efeito para inicializar cliente
  useEffect(() => {
    const client = createSupabaseClient();
    if (client) {
      setSupabase(client);
      
      // Verificar saúde inicial
      checkHealth();
    }
  }, [createSupabaseClient, checkHealth]);
  
  // Efeito para configurar token de autenticação
  useEffect(() => {
    if (supabase && token) {
      // Configurar token de autenticação se necessário
      // O Supabase gerencia isso automaticamente através do auth state
    }
  }, [supabase, token]);
  
  // Efeito para verificação periódica de saúde
  useEffect(() => {
    if (!supabase || !healthCheckInterval) return;
    
    const interval = setInterval(() => {
      checkHealth();
    }, healthCheckInterval);
    
    return () => clearInterval(interval);
  }, [supabase, healthCheckInterval, checkHealth]);
  
  // Efeito para reconexão automática
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.ERROR && autoReconnect && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        reconnect();
      }, retryDelay * (retryCount + 1));
      
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, autoReconnect, retryCount, maxRetries, retryDelay, reconnect]);
  
  // Efeito para escutar eventos de rede
  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === ConnectionStatus.ERROR || connectionStatus === ConnectionStatus.DISCONNECTED) {
        reconnect();
      }
    };
    
    const handleOffline = () => {
      addConnectionEvent(ConnectionStatus.DISCONNECTED, new Error('Conexão com a internet perdida'));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus, addConnectionEvent, reconnect]);
  
  const value: SupabaseContextType = {
    supabase,
    connectionStatus,
    connectionEvents,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    isReconnecting: connectionStatus === ConnectionStatus.RECONNECTING,
    lastError,
    reconnect,
    checkHealth,
    clearEvents
  };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase deve ser usado dentro de um SupabaseProvider');
  }
  return context;
}

export function useSupabaseConnection() {
  const { connectionStatus, isConnected, isReconnecting, lastError, reconnect } = useSupabase();
  return {
    status: connectionStatus,
    isConnected,
    isReconnecting,
    lastError,
    reconnect,
    isOnline: connectionStatus === ConnectionStatus.CONNECTED,
    isOffline: connectionStatus === ConnectionStatus.DISCONNECTED || connectionStatus === ConnectionStatus.ERROR
  };
}

export function useSupabaseEvents() {
  const { connectionEvents, clearEvents } = useSupabase();
  return {
    events: connectionEvents,
    clearEvents,
    lastEvent: connectionEvents[connectionEvents.length - 1],
    eventCount: connectionEvents.length
  };
}