'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
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

  // ========================================
  // AÇÕES DO CONTEXTO
  // ========================================

  const loadUserPreference = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/user/concurso-preference');
      if (!response.ok) {
        if (response.status === 404) {
          dispatch({ type: 'CLEAR_CONTEXT' });
          return;
        }
        throw new Error('Erro ao carregar preferência do usuário');
      }
      const data: UserPreferenceResponse = await response.json();
      if (data.data) {
        dispatch({ type: 'SET_CONTEXT', payload: data.data });
      } else {
        dispatch({ type: 'CLEAR_CONTEXT' });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading user preference:', error.message);
      }
      dispatch({ type: 'CLEAR_CONTEXT' });
    }
  };

  const loadCategories = async (): Promise<void> => {
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
      if (preferenceResponse.ok) {
        const preferenceData: UserPreferenceResponse = await preferenceResponse.json();
        if (preferenceData.data && preferenceData.canChange === false) {
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
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error selecting contest:', error.message);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao selecionar concurso' });
      }
    }
  };

  const loadConteudo = async (filters?: ConteudoFilters): Promise<void> => {
    if (!state.context) return;
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
    }
  };

  const loadProgress = async (): Promise<void> => {
    if (!state.context) return;
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
    }
  };

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
    ? checkCanChangeConcurso(state.context.can_change_until)
    : true;
  
  const daysUntilChange = state.context
    ? calculateDaysUntilChange(state.context.can_change_until)
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
    loadUserPreference();
    loadCategories();
  }, []);

  useEffect(() => {
    if (state.context) {
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