import type { SupabaseClient } from '@supabase/supabase-js';

export interface Apostila {
  id: string;
  titulo: string;
  descricao?: string;
  concurso_id: string;
  categoria_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ApostilaInsert {
  titulo: string;
  descricao?: string;
  concurso_id: string;
  categoria_id: string;
  is_active?: boolean;
  user_id: string;
}

export interface ApostilaUpdate {
  titulo?: string;
  descricao?: string;
  concurso_id?: string;
  categoria_id?: string;
  is_active?: boolean;
}

export interface ApostilaContent {
  id: string;
  apostila_id: string;
  module_number: number;
  title: string;
  content_json: unknown;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  order_index: number;
}

export interface ApostilaContentInsert {
  apostila_id: string;
  module_number: number;
  title: string;
  content_json: unknown;
  is_active?: boolean;
  order_index?: number;
}

export interface ApostilaContentUpdate {
  module_number?: number;
  title?: string;
  content_json?: unknown;
  is_active?: boolean;
  order_index?: number;
}

export interface UserApostilaProgress {
  id: string;
  user_id: string;
  apostila_id: string;
  module_id: string;
  progress_percentage: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserApostilaProgressInsert {
  user_id: string;
  apostila_id: string;
  module_id: string;
  progress_percentage: number;
  completed_at?: string;
}

export interface ApostilaWithContent extends Apostila {
  content: ApostilaContent[];
}

export class ApostilasService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getAll(filters?: {
    concurso_id?: string;
    categoria_id?: string;
    is_active?: boolean;
  }): Promise<Apostila[]> {
    let query = this.supabase
      .from('apostilas')
      .select('*');

    if (filters?.concurso_id) {
      query = query.eq('concurso_id', filters.concurso_id);
    }

    if (filters?.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar apostilas: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string): Promise<Apostila | null> {
    const { data, error } = await this.supabase
      .from('apostilas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar apostila: ${error.message}`);
    }

    return data;
  }

  async create(apostila: ApostilaInsert): Promise<Apostila> {
    const { data, error } = await this.supabase
      .from('apostilas')
      .insert(apostila)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar apostila: ${error.message}`);
    }

    return data;
  }

  async update(id: string, apostila: ApostilaUpdate): Promise<Apostila> {
    const { data, error } = await this.supabase
      .from('apostilas')
      .update({
        ...apostila,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar apostila: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('apostilas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar apostila: ${error.message}`);
    }
  }

  async getWithContent(id: string): Promise<ApostilaWithContent | null> {
    const { data, error } = await this.supabase
      .from('apostilas')
      .select(`
        *,
        apostila_content(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar apostila com conteúdo: ${error.message}`);
    }

    return data;
  }
} 