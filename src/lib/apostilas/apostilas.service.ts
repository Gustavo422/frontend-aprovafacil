import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase.types';

type Apostila = Database['public']['Tables']['apostilas']['Row'];
type ApostilaInsert = Database['public']['Tables']['apostilas']['Insert'];
type ApostilaUpdate = Database['public']['Tables']['apostilas']['Update'];

/**
 * Serviço para gerenciar apostilas
 * Fornece métodos para operações CRUD em apostilas
 */
class ApostilasService {
  private tableName = 'apostilas';

  /**
   * Busca todas as apostilas ativas com paginação
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      concursoId?: string;
      categoriaId?: string;
      searchTerm?: string;
    }
  ): Promise<{ data: Apostila[]; count: number }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.concursoId) {
          query = query.eq('concurso_id', filters.concursoId);
        }
        if (filters.categoriaId) {
          query = query.eq('categoria_id', filters.categoriaId);
        }
        if (filters.searchTerm) {
          query = query.ilike('titulo', `%${filters.searchTerm}%`);
        }
      }

      const { data, count, error } = await query.range(
        (page - 1) * pageSize,
        page * pageSize - 1
      );

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar apostilas:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas'
      );
    }
  }

  /**
   * Busca uma apostila pelo ID
   */
  async findById(id: string): Promise<Apostila | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar apostila:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostila'
      );
    }
  }

  /**
   * Cria uma nova apostila
   */
  async create(apostila: Omit<ApostilaInsert, 'id' | 'created_at' | 'updated_at' | 'user_id'>, userId: string): Promise<Apostila> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...apostila,
          user_id: userId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Falha ao criar apostila');

      return data;
    } catch (error) {
      console.error('Erro ao criar apostila:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao criar apostila'
      );
    }
  }

  /**
   * Atualiza uma apostila existente
   */
  async update(
    id: string,
    updates: Partial<Omit<ApostilaUpdate, 'id' | 'created_at' | 'user_id'>>
  ): Promise<Apostila> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Apostila não encontrada');

      return data;
    } catch (error) {
      console.error('Erro ao atualizar apostila:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao atualizar apostila'
      );
    }
  }

  /**
   * Remove uma apostila (soft delete)
   */
  async remove(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover apostila:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao remover apostila'
      );
    }
  }

  /**
   * Busca as apostilas mais recentes
   */
  async findRecent(limit: number = 5): Promise<Apostila[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar apostilas recentes:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas recentes'
      );
    }
  }

  /**
   * Busca apostilas por concurso
   */
  async findByConcurso(concursoId: string): Promise<Apostila[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('is_active', true)
        .order('titulo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar apostilas por concurso:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas por concurso'
      );
    }
  }

  /**
   * Busca apostilas por categoria
   */
  async findByCategoria(categoriaId: string): Promise<Apostila[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('categoria_id', categoriaId)
        .eq('is_active', true)
        .order('titulo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar apostilas por categoria:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas por categoria'
      );
    }
  }

  /**
   * Busca apostilas por usuário
   */
  async findByUser(userId: string): Promise<Apostila[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar apostilas do usuário:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas do usuário'
      );
    }
  }
}

export const apostilasService = new ApostilasService();
