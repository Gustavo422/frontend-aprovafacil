import { BaseRepository } from './base-repository';
import type { 
  ApostilaRow, 
  ApostilaInsert, 
  ApostilaUpdate,
  ApostilaContentRow,
  UserApostilaProgressRow,
  UserApostilaProgressInsert,
  UserApostilaProgressUpdate
} from '@/types/database.types';

export class ApostilaRepository extends BaseRepository<'apostilas'> {
  constructor() {
    super('apostilas');
  }

  // Busca apostilas por concurso
  async findByConcurso(concursoId: string): Promise<ApostilaRow[]> {
    const { data, error } = await this.client
      .from('apostilas')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Busca apostilas por categoria
  async findByCategoria(categoriaId: string): Promise<ApostilaRow[]> {
    const { data, error } = await this.client
      .from('apostilas')
      .select('*')
      .eq('categoria_id', categoriaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Busca o conteúdo de uma apostila
  async findConteudo(apostilaId: string): Promise<ApostilaContentRow[]> {
    const { data, error } = await this.client
      .from('apostila_content')
      .select('*')
      .eq('apostila_id', apostilaId)
      .order('module_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Atualiza o progresso do usuário em uma apostila
  async atualizarProgresso(
    userId: string,
    apostilaContentId: string,
    progresso: { completed: boolean; progressPercentage: number }
  ): Promise<UserApostilaProgressRow> {
    const updateData: UserApostilaProgressUpdate = {
      user_id: userId,
      apostila_content_id: apostilaContentId,
      completed: progresso.completed,
      progress_percentage: progresso.progressPercentage,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('user_apostila_progress')
      .upsert(updateData, { onConflict: 'user_id,apostila_content_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Busca o progresso do usuário em uma apostila
  async buscarProgresso(
    userId: string, 
    apostilaContentId: string
  ): Promise<{ completed: boolean; progress_percentage: number }> {
    const { data, error } = await this.client
      .from('user_apostila_progress')
      .select('completed, progress_percentage')
      .eq('user_id', userId)
      .eq('apostila_content_id', apostilaContentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum progresso encontrado, retorna um progresso vazio
        return { completed: false, progress_percentage: 0 };
      }
      throw error;
    }

    // Garante que os tipos estejam corretos
    return {
      completed: Boolean(data?.completed),
      progress_percentage: Number(data?.progress_percentage) || 0,
    };
  }
}
