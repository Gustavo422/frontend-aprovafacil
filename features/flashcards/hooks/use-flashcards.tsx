'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlashcardsService } from '../services/flashcards-service';
import { Database } from '@/lib/database.types';

type Flashcard = Database['public']['Tables']['flashcards']['Row'];
// O tipo FlashcardInsert não está sendo usado neste hook.
// type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
// FlashcardUpdate is not used in this hook, so it's removed for now.
// type FlashcardUpdate = Database['public']['Tables']['flashcards']['Update'];
type FlashcardProgressData = Database['public']['Tables']['progresso_usuario_flashcard']['Row'] & {
  acertou?: boolean;
  tentativas?: number;
  tempo_resposta?: number;
};

type FlashcardProgressInsert = Database['public']['Tables']['progresso_usuario_flashcard']['Insert'];

interface FlashcardFilters {
  disciplina?: string;
  tema?: string;
  concurso_id?: string;
  categoria_id?: string;
}
import { useErrorHandler, useAuth } from '@/features/shared/consolidated-shared';

interface UseFlashcardsOptions {
  autoLoad?: boolean;
  initialFilters?: FlashcardFilters;
  page?: number;
  limit?: number;
}

interface FlashcardStats {
  totalFlashcards: number;
  studiedFlashcards: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyRate: number;
}

interface UseFlashcardsReturn {
  flashcards: Flashcard[];
  loading: boolean;
  error: Error | null;
  stats: FlashcardStats | null;
  loadFlashcards: (filters?: FlashcardFilters) => Promise<void>;
  loadByConcurso: (concursoId: string, limit?: number) => Promise<void>;
  loadRandom: (concursoId: string, limit?: number) => Promise<void>;
  saveProgress: (progress: FlashcardProgressInsert) => Promise<FlashcardProgressData | null>;
  loadusuariostats: (userId: string) => Promise<void>;
  loadForReview: (userId: string, limit?: number) => Promise<void>;
  reset: () => void;
}

export function useFlashcards(options: UseFlashcardsOptions = {}): UseFlashcardsReturn {
  const {
    autoLoad = false,
    initialFilters = {},
    page = 1,
    limit = 10,
  } = options;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const errorHandler = useErrorHandler({
    showToast: true,
    toasttitulo: 'Erro de Flashcards',
    fallbackMessage: 'Erro ao carregar flashcards. Tente novamente.',
  });

  const service = useMemo(() => new FlashcardsService(), []);

  // Função utilitária para centralizar carregamento e tratamento de erro/loading
  const handleLoad = useCallback(
    async <T,>(fn: () => Promise<T>, onSuccess?: (data: T) => void) => {
      setLoading(true);
      try {
        const result = await fn();
        onSuccess?.(result);
      } catch (error) {
        errorHandler.execute(() => {
          throw error;
        });
      } finally {
        setLoading(false);
      }
    },
    [errorHandler]
  );

  const loadFlashcards = useCallback(
    async (filters?: FlashcardFilters) => {
      await handleLoad(
        async () => {
          const result = await service.getFlashcards(page, limit, filters as Record<string, unknown> | undefined);
          if (!result.success) throw new Error(result.error || 'Erro desconhecido ao buscar flashcards.');
          if (Array.isArray(result.data)) {
            // Mapeia os campos do banco para o shape esperado
            return result.data.map((item: any) => ({
              id: item.id,
              front: item.frente,
              back: item.verso,
              disciplina: item.disciplina,
              tema: item.tema,
              subtema: item.subtema,
              criado_em: item.criado_em,
              concurso_id: item.concurso_id,
              categoria_id: item.categoria_id,
              peso_disciplina: item.peso_disciplina,
            }));
          }
          return [];
        },
        setFlashcards
      );
    },
    [page, limit, service, handleLoad]
  );

  const loadByConcurso = useCallback(
    async (concursoId: string, lim?: number) => {
      await handleLoad(
        async () => {
          const result = await service.getFlashcardsByConcurso(concursoId, lim);
          if (!result.success) throw new Error(result.error || 'Erro desconhecido ao buscar flashcards por concurso.');
          return (result.data || []).map((item: any) => ({
            id: item.id,
            front: item.frente,
            back: item.verso,
            disciplina: item.disciplina,
            tema: item.tema,
            subtema: item.subtema,
            criado_em: item.criado_em,
            concurso_id: item.concurso_id,
            categoria_id: item.categoria_id,
            peso_disciplina: item.peso_disciplina,
          }));
        },
        setFlashcards
      );
    },
    [service, handleLoad]
  );

  const loadRandom = useCallback(
    async (concursoId: string, lim: number = 10) => {
      await handleLoad(
        async () => {
          const result = await service.getRandomFlashcardsByConcurso(concursoId, lim);
          if (!result.success) throw new Error(result.error || 'Erro desconhecido ao buscar flashcards aleatórios.');
          return (result.data || []).map((item: any) => ({
            id: item.id,
            front: item.frente,
            back: item.verso,
            disciplina: item.disciplina,
            tema: item.tema,
            subtema: item.subtema,
            criado_em: item.criado_em,
            concurso_id: item.concurso_id,
            categoria_id: item.categoria_id,
            peso_disciplina: item.peso_disciplina,
          }));
        },
        setFlashcards
      );
    },
    [service, handleLoad]
  );

  const saveProgress = useCallback(
    async (progress: FlashcardProgressInsert): Promise<FlashcardProgressData | null> => {
      try {
        // Ajustar para garantir que o campo usuario_id seja usado corretamente
        const progressToSave: any = {
          ...progress,
        };
        if ('user_id' in progress && progress.user_id) {
          progressToSave.usuario_id = progress.user_id;
        }
        if ('next_review' in progress) {
          progressToSave.proxima_revisao = progress.next_review ?? null;
        }
        if ('review_count' in progress) {
          progressToSave.contador_revisoes = progress.review_count;
        }
        // Remover apenas se existir
        if ('user_id' in progressToSave) delete progressToSave.user_id;
        if ('next_review' in progressToSave) delete progressToSave.next_review;
        if ('review_count' in progressToSave) delete progressToSave.review_count;
        const result = await service.saveProgress(progressToSave);
        if (!result.success) throw new Error(result.error || 'Erro desconhecido ao salvar progresso.');
        // Garantir que o retorno seja compatível com FlashcardProgressData
        const data = result.data as any;
        return {
          id: data.id,
          user_id: data.usuario_id,
          flashcard_id: data.flashcard_id,
          status: data.status,
          next_review: data.proxima_revisao,
          review_count: data.contador_revisoes,
          atualizado_em: data.atualizado_em,
        } as FlashcardProgressData;
      } catch (error) {
        errorHandler.execute(() => {
          throw error;
        });
        return null;
      }
    },
    [service, errorHandler]
  );

  const loadusuariostats = useCallback(
    async (userId: string) => {
      await handleLoad(
        async () => {
          const result = await service.getusuariostats(userId);
          if (!result.success) throw new Error(result.error || 'Erro desconhecido ao buscar estatísticas do usuário.');
          
          // Como getusuariostats retorna unknown, vamos tratar como dados básicos
          // e calcular as estatísticas a partir dos dados de progresso
          const progressData = result.data as FlashcardProgressData[] | null;
          
          if (!progressData || !Array.isArray(progressData)) {
            return {
              totalFlashcards: 0,
              studiedFlashcards: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              accuracyRate: 0,
            };
          }

          const totalStudied = progressData.length;
          const correctAnswers = progressData.filter(p => p.status === 'correct').length;
          const wrongAnswers = progressData.filter(p => p.status === 'incorrect').length;
          const accuracyRate = totalStudied > 0 ? (correctAnswers / totalStudied) * 100 : 0;

          return {
            totalFlashcards: 0, // Seria calculado separadamente
            studiedFlashcards: totalStudied,
            correctAnswers,
            wrongAnswers,
            accuracyRate,
          };
        },
        setStats
      );
    },
    [service, handleLoad]
  );

  const loadForReview = useCallback(
    async (userId: string, lim: number = 20) => {
      await handleLoad(
        async () => {
          const result = await service.getFlashcardsForReview(userId, lim);
          if (!result.success) throw new Error(result.error || 'Erro desconhecido ao buscar flashcards para revisão.');
          return (result.data || []).map((item: any) => ({
            id: item.id,
            front: item.frente,
            back: item.verso,
            disciplina: item.disciplina,
            tema: item.tema,
            subtema: item.subtema,
            criado_em: item.criado_em,
            concurso_id: item.concurso_id,
            categoria_id: item.categoria_id,
            peso_disciplina: item.peso_disciplina,
          }));
        },
        setFlashcards
      );
    },
    [service, handleLoad]
  );

  const reset = useCallback(() => {
    setFlashcards([]);
    setStats(null);
    setLoading(false);
    errorHandler.reset();
  }, [errorHandler]);

  useEffect(() => {
    if (autoLoad && Object.keys(initialFilters).length > 0) {
      loadFlashcards(initialFilters);
    }
  }, [autoLoad, initialFilters, loadFlashcards]);

  return {
    flashcards,
    loading: loading || errorHandler.isLoading,
    error: errorHandler.error,
    stats,
    loadFlashcards,
    loadByConcurso,
    loadRandom,
    saveProgress,
    loadusuariostats,
    loadForReview,
    reset,
  };
}

export function useFlashcardStudy(concursoId: string, limit: number = 10) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studySession, setStudySession] = useState<{
    startTime: Date;
    totalCards: number;
    concluidoCards: number;
    correctAnswers: number;
  } | null>(null);

  const {
    flashcards,
    loading,
    error,
    loadRandom,
    saveProgress,
    reset: resetFlashcards,
  } = useFlashcards();

  const { user } = useAuth();

  const startSession = useCallback(async () => {
    await loadRandom(concursoId, limit);
    setCurrentIndex(0);
    setStudySession({
      startTime: new Date(),
      totalCards: limit,
      concluidoCards: 0,
      correctAnswers: 0,
    });
  }, [concursoId, limit, loadRandom]);

  const answerCard = useCallback(
    async (flashcardId: string, acertou: boolean) => {
      if (!studySession || !user) return;
      await saveProgress({
        user_id: user.id,
        flashcard_id: flashcardId,
        status: acertou ? 'correct' : 'incorrect',
        next_review: null,
        review_count: 1,
      });
      setStudySession(prev =>
        prev
          ? {
              ...prev,
              concluidoCards: prev.concluidoCards + 1,
              correctAnswers: prev.correctAnswers + (acertou ? 1 : 0),
            }
          : null
      );
      setCurrentIndex(prev => prev + 1);
    },
    [studySession, saveProgress, user]
  );

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setStudySession(null);
    resetFlashcards();
  }, [resetFlashcards]);

  const currentCard = flashcards[currentIndex];
  const isSessionComplete = studySession && currentIndex >= flashcards.length;

  return {
    currentCard,
    currentIndex,
    studySession,
    isSessionComplete,
    loading,
    error,
    startSession,
    answerCard,
    resetSession,
    totalCards: flashcards.length,
    progress: studySession ? (studySession.concluidoCards / studySession.totalCards) * 100 : 0,
  };
} 



