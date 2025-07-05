import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Tipos específicos do serviço para clareza
type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardProgressInsert = Database['public']['Tables']['user_flashcard_progress']['Insert'];
type FlashcardProgressData = Database['public']['Tables']['user_flashcard_progress']['Row'];

// Mock do Supabase - substitua pelas suas variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey);

// Interface para o resultado do serviço
interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class FlashcardsService {
  private async handleRequest<T>(query: PromiseLike<{ data: T | null; error: Error | null }>): Promise<ServiceResult<T>> {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('FlashcardsService Error:', error.message);
      return { success: false, data: null, error: error.message };
    }
  }

    async getFlashcards(page: number, limit: number, filters?: Record<string, unknown>): Promise<ServiceResult<Flashcard[]>> {
    let query = supabase.from('flashcards').select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value as string);
        }
      });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

        return this.handleRequest(query as PromiseLike<{ data: Flashcard[]; error: Error | null }>);
  }

  async getFlashcardsByConcurso(concursoId: string, limit: number = 10): Promise<ServiceResult<Flashcard[]>> {
    const query = supabase
      .from('flashcards')
      .select('*')
      .eq('concurso_id', concursoId)
      .limit(limit);
    return this.handleRequest(query);
  }

  async getRandomFlashcardsByConcurso(concursoId: string, limit: number = 10): Promise<ServiceResult<Flashcard[]>> {
    // Supabase não tem um 'random()' direto e eficiente para grandes tabelas.
    // A abordagem correta seria uma função de banco de dados (RPC).
    // Por enquanto, vamos buscar e embaralhar no cliente (não ideal para produção).
    const { data, error } = await this.getFlashcardsByConcurso(concursoId, limit * 2); // Pega mais para ter aleatoriedade
    if (error || !data) {
      return { success: false, data: null, error: error || 'Failed to fetch flashcards for random selection.' };
    }
    const shuffled = data.sort(() => 0.5 - Math.random());
    return { success: true, data: shuffled.slice(0, limit), error: null };
  }

  async saveProgress(progress: FlashcardProgressInsert): Promise<ServiceResult<FlashcardProgressData>> {
    const query = supabase
      .from('user_flashcard_progress')
      .upsert(progress)
      .select()
      .single();
    return this.handleRequest(query);
  }

    async getUserStats(userId: string): Promise<ServiceResult<unknown>> {
    // Idealmente, isso seria uma RPC (Remote Procedure Call) no Supabase
    // para calcular as estatísticas de forma eficiente.
    const query = supabase.rpc('get_user_flashcard_stats', { p_user_id: userId });
    return this.handleRequest(query);
  }

  async getFlashcardsForReview(userId: string, limit: number = 20): Promise<ServiceResult<Flashcard[]>> {
    // A lógica de revisão (ex: spaced repetition) deve ser implementada aqui.
    // Ex: buscar flashcards cuja `next_review` é hoje ou no passado.
    const query = supabase
      .from('flashcards')
      .select('*, user_flashcard_progress(*)')
      .eq('user_flashcard_progress.user_id', userId)
      .lte('user_flashcard_progress.next_review', new Date().toISOString())
      .order('next_review', { foreignTable: 'user_flashcard_progress', ascending: true })
      .limit(limit);
    return this.handleRequest(query as PromiseLike<{ data: Flashcard[]; error: Error | null }>);
  }
}
