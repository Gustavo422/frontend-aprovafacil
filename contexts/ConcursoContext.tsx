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
import { ConcursoSelector } from '@/components/onboarding/ConcursoSelector';

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
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  // ========================================
  // AÇÕES DO CONTEXTO
  // ========================================

  const loadUserPreference = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, pulando carregamento de preferências');
      dispatch({ type: 'CLEAR_CONTEXT' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/user/concurso-preference');
      const result = await handleApiResponse<UserPreferenceResponse>(response);
      if (!result.success) {
        if (response.status === 404) {
          dispatch({ type: 'CLEAR_CONTEXT' });
          return;
        }
        if (isAuthError(response.status)) {
          dispatch({ type: 'CLEAR_CONTEXT' });
          return;
        }
        if (isServerError(response.status)) {
          const errorMessage = result.error || 'Erro ao carregar preferências. Tente novamente mais tarde.';
          dispatch({ type: 'SET_ERROR', payload: `[SERVER_ERROR:${response.status}] ${errorMessage}` });
          showErrorToastFromStatus(response.status, 'Erro ao carregar preferências de concurso. Tente novamente mais tarde.');
        } else {
          const errorMessage = result.error || 'Erro ao carregar preferências. Tente novamente.';
          dispatch({ type: 'SET_ERROR', payload: `[ERROR:${response.status}] ${errorMessage}` });
          showErrorToastFromStatus(response.status, result.error);
        }
        dispatch({ type: 'CLEAR_CONTEXT' });
        return;
      }
      if (result.data?.data) {
        dispatch({ type: 'SET_CONTEXT', payload: result.data.data });
      } else {
        dispatch({ type: 'CLEAR_CONTEXT' });
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar preferências:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro de conexão. Verifique sua internet e tente novamente.' });
      dispatch({ type: 'CLEAR_CONTEXT' });
      showNetworkErrorToast();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/concurso-categorias');
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }
      const data = await response.json();
      dispatch({ type: 'SET_CATEGORIES', payload: data.data || [] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading categories:', error.message);
      }
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, []);

  const loadConcursosByCategory = async (categoriaId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/concursos?categoria_id=${categoriaId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar concursos da categoria');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_CONCURSOS', payload: data.data || [] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Add eslint exceptions for debug logs
      }
      dispatch({ type: 'SET_CONCURSOS', payload: [] });
    }
  };

  const selectConcurso = async (concursoId: string, categoriaId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Verificar se pode trocar de concurso
      const preferenceResponse = await fetch('/api/user/concurso-preference');
      const preferenceResult = await handleApiResponse<UserPreferenceResponse>(preferenceResponse);
      
      if (preferenceResult.success) {
        if (preferenceResult.data?.data && preferenceResult.data.canChange === false) {
          const errorMessage = `Você só pode trocar de concurso em ${preferenceResult.data.daysUntilChange} dias`;
          showErrorToast('Troca de concurso não permitida', errorMessage);
          throw new Error(errorMessage);
        }
      } else if (isServerError(preferenceResult.status)) {
        // Se for erro de servidor, mostrar mensagem específica
        const errorMessage = preferenceResult.error || 'Erro no servidor ao verificar preferências';
        showErrorToastFromStatus(preferenceResult.status, errorMessage);
        throw new Error(errorMessage);
      }
      
      // Selecionar novo concurso
      const response = await fetch('/api/user/concurso-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurso_id: concursoId, categoria_id: categoriaId })
      });
      
      const result = await handleApiResponse(response);
      
      if (!result.success) {
        const errorMessage = result.error || 'Erro ao selecionar concurso';
        showErrorToastFromStatus(result.status, errorMessage);
        throw new Error(errorMessage);
      }
      
      // Recarregar preferência atualizada
      await loadUserPreference();
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error selecting contest:', error.message);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        const errorMessage = 'Erro ao selecionar concurso';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        showErrorToast('Erro', errorMessage);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadConteudo = useCallback(async (filters?: ConteudoFilters): Promise<void> => {
    if (!state.context || !state.context.categoria_id || !state.context.concurso_id) return;
    
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, pulando carregamento de conteúdo');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const params = new URLSearchParams({
        categoria_id: state.context.categoria_id,
        concurso_id: state.context.concurso_id,
        ...(filters && Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== undefined)))
      });
      const response = await fetch(`/api/conteudo/filtrado?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar conteúdo');
      }
      const data: ConteudoFiltradoResponse = await response.json();
      dispatch({ type: 'SET_CONTENT', payload: data });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading content:', error.message);
      }
      dispatch({ type: 'SET_CONTENT', payload: {
        data: { simulados: [], flashcards: [], apostilas: [], mapaAssuntos: [] },
        total: 0,
        page: 1,
        limit: 10
      } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.context?.categoria_id, state.context?.concurso_id, isAuthenticated]);

  const loadProgress = useCallback(async (): Promise<void> => {
    if (!state.context || !state.context.concurso_id) return;
    
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, pulando carregamento de progresso');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`/api/dashboard/stats?concurso_id=${state.context.concurso_id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar progresso');
      }
      const data = await response.json();
      dispatch({ type: 'SET_PROGRESS', payload: data.data });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading progress:', error.message);
      }
      dispatch({ type: 'SET_PROGRESS', payload: {
        progresso_geral: {
          total_questoes: 0,
          questoes_respondidas: 0,
          acertos: 0,
          erros: 0,
          taxa_acerto: 0,
          tempo_medio: 0
        },
        progresso_disciplinas: {},
        ultima_atualizacao: new Date().toISOString()
      } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.context?.concurso_id, isAuthenticated]);

  const updateProgress = (progress: Partial<UserProgress>): void => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  };

  const clearContext = (): void => {
    dispatch({ type: 'CLEAR_CONTEXT' });
  };

  // ========================================
  // GETTERS
  // ========================================

  const hasSelectedConcurso = !!state.context?.concurso_id;
  
  const canChangeConcurso = state.context
    ? checkCanChangeConcurso(state.context.pode_alterar_ate)
    : true;
  
  const daysUntilChange = state.context
    ? calculateDaysUntilChange(state.context.pode_alterar_ate)
    : 0;
  
  const categoriaSlug = state.context && state.availableCategories.length > 0
    ? (state.availableCategories.find(cat => cat.id === state.context!.categoria_id)?.slug as ConcursoCategoriaSlug | null)
    : null;
  const concursoId = state.context?.concurso_id || null;
  const categoriaId = state.context?.categoria_id || null;
  const selectedCategoria = state.context && state.availableCategories.length > 0
    ? state.availableCategories.find(cat => cat.id === state.context!.categoria_id) ?? null
    : null;
  const selectedConcurso = state.context && state.availableConcursos.length > 0
    ? state.availableConcursos.find(conc => conc.id === state.context!.concurso_id) ?? null
    : null;

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadUserPreference();
      loadCategories();
    }
  }, [authLoading, isAuthenticated, loadUserPreference, loadCategories]);

  useEffect(() => {
    if (state.context && state.context.concurso_id) {
      loadConteudo();
      loadProgress();
    }
  }, [state.context?.concurso_id]);

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
      {state.context && state.context.concurso_id && state.context.categoria_id ? (
        children
      ) : (
        <ConcursoSelector />
      )}
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
