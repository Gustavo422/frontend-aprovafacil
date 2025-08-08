'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { 
  ConcursoContext as ConcursoContextType,
  ConcursoCategoria,
  Concurso,
  ConcursoProgress,
  ConcursoCategoriaSlug,
  ConcursoComCategoria,
  UserProgress,
  ConteudoFiltradoResponse,
  ConteudoFilters,
  UserPreferenceResponse
} from '@/src/types/concurso';
import { handleApiResponse, isAuthError, isServerError } from '@/utils/api-error-handler';
import { showErrorToast, showErrorToastFromStatus, showNetworkErrorToast } from '@/utils/error-toast';
import { useAuth } from '@/features/auth/contexts/auth-context';
// Removido: import de ConcursoSelector (rota de seleção removida)

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================

const STORAGE_KEY = 'aprovafacil_concurso_context';
const SYNC_EVENT = 'aprovafacil_concurso_sync';

// ========================================
// TIPOS DO CONTEXTO
// ========================================

interface ConcursoState {
  isLoading: boolean;
  error: string | null;
  context: ConcursoContextType | null;
  content: ConteudoFiltradoResponse | null;
  progress: ConcursoProgress | null;
  isInitialized: boolean;
  availableCategories: ConcursoCategoria[];
  availableConcursos: ConcursoComCategoria[];
  // Novos campos para estado global
  activeConcursoId: string | null;
  lastSyncTimestamp: number;
  isSyncing: boolean;
}

type ConcursoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONTEXT'; payload: ConcursoContextType }
  | { type: 'SET_CONTENT'; payload: ConteudoFiltradoResponse }
  | { type: 'SET_PROGRESS'; payload: ConcursoProgress }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<UserProgress> }
  | { type: 'SET_CATEGORIES'; payload: ConcursoCategoria[] }
  | { type: 'SET_CONCURSOS'; payload: ConcursoComCategoria[] }
  | { type: 'CLEAR_CONTEXT' }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  // Novas ações para estado global
  | { type: 'SET_ACTIVE_CONCURSO'; payload: string | null }
  | { type: 'SET_SYNC_TIMESTAMP'; payload: number }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SYNC_FROM_STORAGE'; payload: Partial<ConcursoState> };

// ========================================
// REDUCER
// ========================================

const concursoReducer = (state: ConcursoState, action: ConcursoAction): ConcursoState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CONTEXT':
      return { 
        ...state, 
        context: action.payload, 
        error: null, 
        isLoading: false,
        isInitialized: true,
        activeConcursoId: action.payload.concurso_id || null
      };
    
    case 'SET_CONTENT':
      return { ...state, content: action.payload };
    
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'UPDATE_PROGRESS':
      return { 
        ...state, 
        progress: state.progress ? { 
          ...state.progress, 
          progresso_geral: { ...state.progress.progresso_geral, ...action.payload } 
        } : null 
      };
    
    case 'SET_CATEGORIES':
      return { ...state, availableCategories: action.payload };
    
    case 'SET_CONCURSOS':
      return { ...state, availableConcursos: action.payload };
    
    case 'CLEAR_CONTEXT':
      return {
        isLoading: false,
        error: null,
        context: null,
        content: null,
        progress: null,
        isInitialized: true,
        availableCategories: [],
        availableConcursos: [],
        activeConcursoId: null,
        lastSyncTimestamp: Date.now(),
        isSyncing: false
      };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    // Novas ações para estado global
    case 'SET_ACTIVE_CONCURSO':
      return { 
        ...state, 
        activeConcursoId: action.payload,
        lastSyncTimestamp: Date.now()
      };

    case 'SET_SYNC_TIMESTAMP':
      return { ...state, lastSyncTimestamp: action.payload };

    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };

    case 'SYNC_FROM_STORAGE':
      return { 
        ...state, 
        ...action.payload,
        isSyncing: false,
        lastSyncTimestamp: Date.now()
      };

    default:
      return state;
  }
};

// ========================================
// ESTADO INICIAL
// ========================================

const initialState: ConcursoState = {
  isLoading: false,
  error: null,
  context: null,
  content: null,
  progress: null,
  isInitialized: false,
  availableCategories: [],
  availableConcursos: [],
  activeConcursoId: null,
  lastSyncTimestamp: 0,
  isSyncing: false
};

// ========================================
// UTILITÁRIOS DE STORAGE
// ========================================

const storageUtils = {
  save: (data: Partial<ConcursoState>) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...data,
          lastSyncTimestamp: Date.now()
        }));
      }
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  },

  load: (): Partial<ConcursoState> | null => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.warn('Erro ao carregar do localStorage:', error);
    }
    return null;
  },

  clear: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
  }
};

// ========================================
// UTILITÁRIOS DE SINCRONIZAÇÃO
// ========================================

const syncUtils = {
  broadcast: (data: Partial<ConcursoState>) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
          detail: { ...data, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.warn('Erro ao sincronizar entre abas:', error);
    }
  },

  listen: (callback: (data: Partial<ConcursoState>) => void) => {
    if (typeof window !== 'undefined') {
      const handler = (event: CustomEvent) => {
        callback(event.detail);
      };
      
      window.addEventListener(SYNC_EVENT, handler as EventListener);
      
      return () => {
        window.removeEventListener(SYNC_EVENT, handler as EventListener);
      };
    }
    return () => {};
  }
};

// ========================================
// CONTEXTO
// ========================================

interface ConcursoContextValue {
  // Estado
  state: ConcursoState;
  
  // Ações
  loadUserPreference: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadConcursosByCategory: (categoriaId: string) => Promise<void>;
  selectConcurso: (concursoId: string, categoriaId: string) => Promise<void>;
  loadConteudo: (filters?: ConteudoFilters) => Promise<void>;
  loadProgress: () => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearContext: () => void;
  
  // Novas ações para estado global
  setActiveConcurso: (concursoId: string | null) => void;
  syncContext: () => void;
  loadFromStorage: () => void;
  
  // Getters
  hasSelectedConcurso: boolean;
  canChangeConcurso: boolean;
  daysUntilChange: number;
  categoriaSlug: ConcursoCategoriaSlug | null;
  concursoId: string | null;
  categoriaId: string | null;
  selectedCategoria: ConcursoCategoria | null;
  selectedConcurso: Concurso | null;
  availableCategories: ConcursoCategoria[];
  availableConcursos: ConcursoComCategoria[];
  
  // Novos getters para estado global
  activeConcursoId: string | null;
  isSyncing: boolean;
  lastSyncTimestamp: number;
  token: string | null;
}

const ConcursoContext = createContext<ConcursoContextValue | undefined>(undefined);

interface ConcursoProviderProps {
  children: ReactNode;
}

export function ConcursoProvider({ children }: ConcursoProviderProps) {
  const [state, dispatch] = useReducer(concursoReducer, initialState);
  const { user, isAuthenticated, getToken } = useAuth();

  // ========================================
  // EFEITOS DE SINCRONIZAÇÃO
  // ========================================

  // Carregar estado inicial do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !state.isInitialized) {
      const stored = storageUtils.load();
      if (stored) {
        dispatch({ type: 'SYNC_FROM_STORAGE', payload: stored });
      }
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, [state.isInitialized]);

  // Sincronizar entre abas
  useEffect(() => {
    const cleanup = syncUtils.listen((data) => {
      // Ignorar eventos muito antigos (mais de 5 segundos)
      if (Date.now() - (data as any).timestamp > 5000) return;
      
      dispatch({ type: 'SYNC_FROM_STORAGE', payload: data });
    });

    return cleanup;
  }, []);

  // Salvar no localStorage quando o estado mudar
  useEffect(() => {
    if (state.isInitialized && state.context) {
      const dataToSave = {
        context: state.context,
        activeConcursoId: state.activeConcursoId,
        lastSyncTimestamp: state.lastSyncTimestamp
      };
      
      storageUtils.save(dataToSave);
      syncUtils.broadcast(dataToSave);
    }
  }, [state.context, state.activeConcursoId, state.isInitialized]);

  // Carregar preferência do usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && !state.context) {
      loadUserPreference();
    }
  }, [isAuthenticated, user, state.context]);

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  const calculateDaysUntilChange = (canChangeUntil: string): number => {
    const changeDate = new Date(canChangeUntil);
    const now = new Date();
    const diffTime = changeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const checkCanChangeConcurso = (canChangeUntil: string): boolean => {
    const changeDate = new Date(canChangeUntil);
    const now = new Date();
    return now >= changeDate;
  };

  // ========================================
  // AÇÕES PRINCIPAIS
  // ========================================

  const loadUserPreference = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Obter token do auth context
      const token = getToken();
      if (!token) {
        dispatch({ type: 'SET_ERROR', payload: 'Token não encontrado' });
        return;
      }

      const response = await fetch('/api/user/concurso-preference', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserPreferenceResponse = await response.json();

      if (data.data) {
        const preference = data.data;
        
        dispatch({
          type: 'SET_CONTEXT',
          payload: {
            concurso_id: preference.concurso_id,
            categoria_id: preference.categoria_id,
            pode_alterar_ate: preference.pode_alterar_ate,
            criado_em: preference.criado_em,
            atualizado_em: preference.atualizado_em,
          },
        });

        // Atualizar concurso ativo
        dispatch({ type: 'SET_ACTIVE_CONCURSO', payload: preference.concurso_id });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar preferência' });
      }
    } catch (error) {
      console.error('Erro ao carregar preferência do usuário:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar preferência do usuário' });
    }
  };

  const loadCategories = async (): Promise<void> => {
    try {
      const response = await fetch('/api/concurso-categorias', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        dispatch({ type: 'SET_CATEGORIES', payload: data.data });
      } else {
        console.error('Erro ao carregar categorias:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadConcursosByCategory = async (categoriaId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/concursos?categoria_id=${categoriaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        dispatch({ type: 'SET_CONCURSOS', payload: data.data });
      } else {
        console.error('Erro ao carregar concursos:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar concursos:', error);
    }
  };

  const selectConcurso = async (concursoId: string, categoriaId: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Obter token do auth context
      const token = getToken();
      if (!token) {
        dispatch({ type: 'SET_ERROR', payload: 'Token não encontrado' });
        return;
      }

      const response = await fetch('/api/user/concurso-preference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concurso_id: concursoId,
          categoria_id: categoriaId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

             if (data.data) {
         const preference = data.data;
         
         dispatch({
           type: 'SET_CONTEXT',
           payload: {
             concurso_id: preference.concurso_id,
             categoria_id: preference.categoria_id,
             pode_alterar_ate: preference.pode_alterar_ate,
             criado_em: preference.criado_em,
             atualizado_em: preference.atualizado_em,
           },
         });

         // Atualizar concurso ativo
         dispatch({ type: 'SET_ACTIVE_CONCURSO', payload: preference.concurso_id });

         // Carregar conteúdo e progresso após selecionar concurso
         await Promise.all([
           loadConteudo(),
           loadProgress(),
         ]);
       } else {
         dispatch({ type: 'SET_ERROR', payload: 'Erro ao selecionar concurso' });
       }
    } catch (error) {
      console.error('Erro ao selecionar concurso:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao selecionar concurso' });
    }
  };

  const loadConteudo = async (filters?: ConteudoFilters): Promise<void> => {
    if (!state.context?.concurso_id) {
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/conteudo/filtrado?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        dispatch({ type: 'SET_CONTENT', payload: data.data });
      } else {
        console.error('Erro ao carregar conteúdo:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    }
  };

  const loadProgress = async (): Promise<void> => {
    if (!state.context?.concurso_id) {
      return;
    }

    try {
      const response = await fetch('/api/dashboard/enhanced-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        dispatch({ type: 'SET_PROGRESS', payload: data.data });
      } else {
        console.error('Erro ao carregar progresso:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const updateProgress = (progress: Partial<UserProgress>): void => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  };

  const clearContext = (): void => {
    dispatch({ type: 'CLEAR_CONTEXT' });
    storageUtils.clear();
  };

  // ========================================
  // NOVAS AÇÕES PARA ESTADO GLOBAL
  // ========================================

  const setActiveConcurso = (concursoId: string | null): void => {
    dispatch({ type: 'SET_ACTIVE_CONCURSO', payload: concursoId });
  };

  const syncContext = (): void => {
    dispatch({ type: 'SET_SYNCING', payload: true });
    
    // Simular sincronização
    setTimeout(() => {
      const stored = storageUtils.load();
      if (stored) {
        dispatch({ type: 'SYNC_FROM_STORAGE', payload: stored });
      }
    }, 100);
  };

  const loadFromStorage = (): void => {
    const stored = storageUtils.load();
    if (stored) {
      dispatch({ type: 'SYNC_FROM_STORAGE', payload: stored });
    }
  };

  // ========================================
  // GETTERS
  // ========================================

  const hasSelectedConcurso = !!state.context?.concurso_id;
  const canChangeConcurso = state.context?.pode_alterar_ate 
    ? checkCanChangeConcurso(state.context.pode_alterar_ate)
    : true;
  const daysUntilChange = state.context?.pode_alterar_ate 
    ? calculateDaysUntilChange(state.context.pode_alterar_ate)
    : 0;
  const categoriaSlug = state.availableCategories.find(cat => cat.id === state.context?.categoria_id)?.slug as ConcursoCategoriaSlug || null;
  const concursoId = state.context?.concurso_id || null;
  const categoriaId = state.context?.categoria_id || null;
  const selectedCategoria = state.availableCategories.find(cat => cat.id === categoriaId) || null;
  const selectedConcurso = state.availableConcursos.find(conc => conc.id === concursoId) || null;

  const value: ConcursoContextValue = {
    state,
    loadUserPreference,
    loadCategories,
    loadConcursosByCategory,
    selectConcurso,
    loadConteudo,
    loadProgress,
    updateProgress,
    clearContext,
    setActiveConcurso,
    syncContext,
    loadFromStorage,
    hasSelectedConcurso,
    canChangeConcurso,
    daysUntilChange,
    categoriaSlug,
    concursoId,
    categoriaId,
    selectedCategoria,
    selectedConcurso,
    availableCategories: state.availableCategories,
    availableConcursos: state.availableConcursos,
    activeConcursoId: state.activeConcursoId,
    isSyncing: state.isSyncing,
    lastSyncTimestamp: state.lastSyncTimestamp,
    token: getToken(),
  };

  return (
    <ConcursoContext.Provider value={value}>
      {children}
    </ConcursoContext.Provider>
  );
}

// ========================================
// HOOKS
// ========================================

export function useConcurso(): ConcursoContextValue {
  const context = useContext(ConcursoContext);
  if (context === undefined) {
    throw new Error('useConcurso deve ser usado dentro de um ConcursoProvider');
  }
  return context;
}

export function useConcursoContext(): ConcursoContextType | null {
  return useConcurso().state.context;
}

export function useConcursoContent(): ConteudoFiltradoResponse | null {
  return useConcurso().state.content;
}

export function useConcursoProgress(): ConcursoProgress | null {
  return useConcurso().state.progress;
}

export function useConcursoSelection() {
  const { state, hasSelectedConcurso, canChangeConcurso, daysUntilChange } = useConcurso();
  
  return {
    hasSelectedConcurso,
    canChangeConcurso,
    daysUntilChange,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
  };
}

export function useConcursoActions() {
  const { 
    loadUserPreference, 
    loadCategories, 
    loadConcursosByCategory, 
    selectConcurso,
    loadConteudo,
    loadProgress,
    updateProgress,
    clearContext,
    setActiveConcurso,
    syncContext,
    loadFromStorage
  } = useConcurso();
  
  return {
    loadUserPreference,
    loadCategories,
    loadConcursosByCategory,
    selectConcurso,
    loadConteudo,
    loadProgress,
    updateProgress,
    clearContext,
    setActiveConcurso,
    syncContext,
    loadFromStorage,
  };
}

// ========================================
// HOOKS ESPECÍFICOS PARA ESTADO GLOBAL
// ========================================

export function useActiveConcurso() {
  const { activeConcursoId, isSyncing, lastSyncTimestamp } = useConcurso();
  
  return {
    activeConcursoId,
    isSyncing,
    lastSyncTimestamp,
    isActive: !!activeConcursoId,
  };
}

export function useConcursoSync() {
  const { syncContext, loadFromStorage, isSyncing, lastSyncTimestamp } = useConcurso();
  
  return {
    syncContext,
    loadFromStorage,
    isSyncing,
    lastSyncTimestamp,
    lastSyncDate: new Date(lastSyncTimestamp),
  };
}
