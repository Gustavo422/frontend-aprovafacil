'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useCallback } from 'react';
import type { 
  ConcursoContext as ConcursoContextType,
  ConcursoCategoria,
  Concurso,
  ConteudoFiltradoResponse,
  UserProgress,
  ConcursoProgress,
  ConcursoCategoriaSlug,
  ConteudoFilters,
  ConcursoComCategoria,
  UserPreferenceResponse
} from '@/types/concurso';

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
  | { type: 'SET_INITIALIZED'; payload: boolean };

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
        isInitialized: true 
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
        availableConcursos: []
      };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    default:
      return state;
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
}

const ConcursoContext = createContext<ConcursoContextValue | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

interface ConcursoProviderProps {
  children: ReactNode;
}

export function ConcursoProvider({ children }: ConcursoProviderProps) {
  const [state, dispatch] = useReducer(concursoReducer, {
    isLoading: false,
    error: null,
    context: null,
    content: null,
    progress: null,
    isInitialized: false,
    availableCategories: [],
    availableConcursos: []
  });

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  const calculateDaysUntilChange = (canChangeUntil: string): number => {
    const now = new Date();
    const changeDate = new Date(canChangeUntil);
    const diffTime = changeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const checkCanChangeConcurso = (canChangeUntil: string): boolean => {
    return calculateDaysUntilChange(canChangeUntil) === 0;
  };

  // Verificar se o usuário está autenticado (tem token)
  const isAuthenticated = (): boolean => {
    // Verificar se há token nos cookies ou localStorage
    const cookies = document.cookie.split(';').reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    // Verificar tokens conhecidos
    const hasAccessToken = cookies.accessToken || 
                          cookies.auth_token || 
                          localStorage.getItem('accessToken') ||
                          localStorage.getItem('auth_token');

    return !!hasAccessToken;
  };

  // ========================================
  // AÇÕES DO CONTEXTO
  // ========================================

  const loadUserPreference = useCallback(async (): Promise<void> => {
    // Verificar se o usuário está autenticado antes de fazer a chamada
    if (!isAuthenticated()) {
      console.log('Usuário não autenticado, pulando carregamento de preferências');
      dispatch({ type: 'CLEAR_CONTEXT' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/user/concurso-preference');
      
      if (!response.ok) {
        if (response.status === 404) {
          // Usuário não tem preferência definida
          dispatch({ type: 'CLEAR_CONTEXT' });
          return;
        }
        throw new Error('Erro ao carregar preferência do usuário');
      }
      
      const data: UserPreferenceResponse = await response.json();
      
      if (data.data) {
        // Primeiro buscar o concurso para obter a categoria_id
        const concursoResponse = await fetch(`/api/concursos/${data.data.concurso_id}`);
        
        if (!concursoResponse.ok) {
          throw new Error('Erro ao carregar dados do concurso');
        }
        
        const concursoData = await concursoResponse.json();
        const categoriaId = concursoData.data.categoria_id;
        
        if (!categoriaId) {
          throw new Error('Concurso não possui categoria associada');
        }
        
        // Agora buscar categoria e disciplinas usando a categoria_id do concurso
        const [categoriaResponse, disciplinasResponse] = await Promise.all([
          fetch(`/api/concurso-categorias/${categoriaId}`),
          fetch(`/api/categoria-disciplinas?categoria_id=${categoriaId}`)
        ]);
        
        if (!categoriaResponse.ok || !disciplinasResponse.ok) {
          throw new Error('Erro ao carregar dados da categoria');
        }
        
        const [categoriaData, disciplinasData] = await Promise.all([
          categoriaResponse.json(),
          disciplinasResponse.json()
        ]);
        
        const userPref = data.data;
        const context: ConcursoContextType = {
          concurso_id: userPref?.concurso_id || concursoData.data?.id || '',
          categoria_id: userPref?.categoria_id || categoriaData.data?.id || '',
          pode_alterar_ate: userPref?.pode_alterar_ate || '',
          criado_em: userPref?.criado_em || '',
          atualizado_em: userPref?.atualizado_em || '',
          categoria: categoriaData.data,
          concurso: concursoData.data,
          disciplinas: disciplinasData.data,
          userPreference: userPref
        };
        
        dispatch({ type: 'SET_CONTEXT', payload: context });
      } else {
        dispatch({ type: 'CLEAR_CONTEXT' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erro ao carregar preferência do usuário' 
      });
    }
  }, []);

  const loadCategories = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/concurso-categorias');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_CATEGORIES', payload: data.data || [] });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erro ao carregar categorias' 
      });
    }
  };

  const loadConcursosByCategory = async (categoriaId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/concursos?categoria_id=${categoriaId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar concursos da categoria');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_CONCURSOS', payload: data.data || [] });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erro ao carregar concursos da categoria' 
      });
    }
  };

  const selectConcurso = async (concursoId: string, categoriaId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Verificar se pode trocar de concurso
      const preferenceResponse = await fetch('/api/user/concurso-preference');
      if (preferenceResponse.ok) {
        const preferenceData: UserPreferenceResponse = await preferenceResponse.json();
        if (preferenceData.data && !preferenceData.canChange) {
          throw new Error(`Você só pode trocar de concurso em ${preferenceData.daysUntilChange} dias`);
        }
      }
      
      // Selecionar novo concurso
      const response = await fetch('/api/user/concurso-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurso_id: concursoId, categoria_id: categoriaId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao selecionar concurso');
      }
      
      // Recarregar preferência atualizada
      await loadUserPreference();
      
    } catch (error) {
      // Error handling moved to error state
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao selecionar concurso' });
    }
  };

  const loadConteudo = useCallback(async (filters?: ConteudoFilters): Promise<void> => {
    if (!state.context) return;
    
    // Verificar se o usuário está autenticado antes de fazer a chamada
    if (!isAuthenticated()) {
      console.log('Usuário não autenticado, pulando carregamento de conteúdo');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const params = new URLSearchParams({
        categoria_id: state.context.categoria?.id || '',
        concurso_id: state.context.concurso?.id || '',
        ...(filters && Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)))
      });
      
      const response = await fetch(`/api/conteudo/filtrado?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar conteúdo');
      }
      
      const data: ConteudoFiltradoResponse = await response.json();
      dispatch({ type: 'SET_CONTENT', payload: data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar conteúdo';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.context]);

  const loadProgress = useCallback(async (): Promise<void> => {
    if (!state.context) return;
    
    // Verificar se o usuário está autenticado antes de fazer a chamada
    if (!isAuthenticated()) {
      console.log('Usuário não autenticado, pulando carregamento de progresso');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/dashboard/stats?concurso_id=${state.context.concurso?.id || ''}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar progresso');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_PROGRESS', payload: data.data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar progresso';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.context]);

  const updateProgress = (progress: Partial<UserProgress>): void => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  };

  const clearContext = (): void => {
    dispatch({ type: 'CLEAR_CONTEXT' });
  };

  // ========================================
  // GETTERS
  // ========================================

  const hasSelectedConcurso = !!state.context?.concurso;
  
  const canChangeConcurso = state.context?.userPreference 
    ? checkCanChangeConcurso(state.context.userPreference.pode_alterar_ate)
    : true;
  
  const daysUntilChange = state.context?.userPreference 
    ? calculateDaysUntilChange(state.context.userPreference.pode_alterar_ate)
    : 0;
  
  const categoriaSlug = state.context?.categoria?.slug as ConcursoCategoriaSlug | null;
  const concursoId = state.context?.concurso?.id || null;
  const categoriaId = state.context?.categoria?.id || null;
  const selectedCategoria = state.context?.categoria || null;
  const selectedConcurso = state.context?.concurso || null;

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    loadUserPreference();
    loadCategories();
  }, [loadUserPreference]);

  useEffect(() => {
    if (state.context) {
      loadConteudo();
      loadProgress();
    }
  }, [state.context?.concurso?.id, loadConteudo, loadProgress, state.context]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: ConcursoContextValue = {
    state,
    loadUserPreference,
    loadCategories,
    loadConcursosByCategory,
    selectConcurso,
    loadConteudo,
    loadProgress,
    updateProgress,
    clearContext,
    hasSelectedConcurso,
    canChangeConcurso,
    daysUntilChange,
    categoriaSlug,
    concursoId,
    categoriaId,
    selectedCategoria,
    selectedConcurso,
    availableCategories: state.availableCategories,
    availableConcursos: state.availableConcursos
  };

  return (
    <ConcursoContext.Provider value={contextValue}>
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
  const { state } = useConcurso();
  return state.context;
}

export function useConcursoContent(): ConteudoFiltradoResponse | null {
  const { state } = useConcurso();
  return state.content;
}

export function useConcursoProgress(): ConcursoProgress | null {
  const { state } = useConcurso();
  return state.progress;
}

export function useConcursoSelection() {
  const { 
    hasSelectedConcurso, 
    canChangeConcurso, 
    daysUntilChange,
    categoriaSlug,
    concursoId,
    categoriaId,
    selectedCategoria,
    selectedConcurso,
    availableCategories,
    availableConcursos
  } = useConcurso();
  
  return {
    hasSelectedConcurso,
    canChangeConcurso,
    daysUntilChange,
    categoriaSlug,
    concursoId,
    categoriaId,
    selectedCategoria,
    selectedConcurso,
    availableCategories,
    availableConcursos
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
    clearContext
  } = useConcurso();
  
  return {
    loadUserPreference,
    loadCategories,
    loadConcursosByCategory,
    selectConcurso,
    loadConteudo,
    loadProgress,
    updateProgress,
    clearContext
  };
} 



