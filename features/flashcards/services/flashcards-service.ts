import type { Database } from '@/src/types/supabase.types';

// Tipos específicos do serviço para clareza
export type Flashcard = Database['public']['Tables']['cartoes_memorizacao']['Row'];
export type FlashcardProgressInsert = Database['public']['Tables']['progresso_usuario_flashcard']['Insert'];
export type FlashcardProgressData = Database['public']['Tables']['progresso_usuario_flashcard']['Row'];

// Tipos adicionais para compatibilidade
export interface FlashcardFilters {
  concurso_id?: string;
  categoria_id?: string;
  disciplina_id?: string;
  ativo?: boolean;
}

export interface FlashcardInsert {
  titulo: string;
  conteudo: string;
  resposta: string;
  concurso_id: string;
  categoria_id?: string;
  disciplina_id?: string;
  ativo?: boolean;
  user_id: string;
}

export interface FlashcardUpdate {
  titulo?: string;
  conteudo?: string;
  resposta?: string;
  concurso_id?: string;
  categoria_id?: string;
  disciplina_id?: string;
  ativo?: boolean;
}

// Interface para o resultado do serviço
interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class FlashcardsService {
  private async handleRequest<T>(url: string, options?: RequestInit): Promise<ServiceResult<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro na requisição' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('FlashcardsService Error:', error.message);
      return { success: false, data: null, error: error.message };
    }
  }

  async getFlashcards(page: number, limit: number, filters?: Record<string, unknown>): Promise<ServiceResult<Flashcard[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters && Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      ))
    });

    return this.handleRequest<Flashcard[]>(`/api/flashcards?${params}`);
  }

  async getFlashcardsByConcurso(concursoId: string, limit: number = 10): Promise<ServiceResult<Flashcard[]>> {
    const params = new URLSearchParams({
      concurso_id: concursoId,
      limit: limit.toString()
    });

    return this.handleRequest<Flashcard[]>(`/api/flashcards?${params}`);
  }

  async getRandomFlashcardsByConcurso(concursoId: string, limit: number = 10): Promise<ServiceResult<Flashcard[]>> {
    const params = new URLSearchParams({
      concurso_id: concursoId,
      limit: limit.toString(),
      random: 'true'
    });

    return this.handleRequest<Flashcard[]>(`/api/flashcards?${params}`);
  }

  async saveProgress(progress: FlashcardProgressInsert): Promise<ServiceResult<FlashcardProgressData>> {
    return this.handleRequest<FlashcardProgressData>('/api/flashcards/progress', {
      method: 'POST',
      body: JSON.stringify(progress)
    });
  }

  async getusuariostats(userId: string): Promise<ServiceResult<unknown>> {
    return this.handleRequest<unknown>(`/api/flashcards/stats?user_id=${userId}`);
  }

  async getFlashcardsForReview(userId: string, limit: number = 20): Promise<ServiceResult<Flashcard[]>> {
    const params = new URLSearchParams({
      user_id: userId,
      limit: limit.toString(),
      review: 'true'
    });

    return this.handleRequest<Flashcard[]>(`/api/flashcards?${params}`);
  }
}
