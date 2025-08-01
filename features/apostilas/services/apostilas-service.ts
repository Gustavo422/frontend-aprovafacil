import type { SupabaseClient } from '@supabase/supabase-js';

export interface Apostila {
  id: string;
  titulo: string;
  descricao?: string;
  concurso_id: string;
  categoria_id: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  usuario_id: string;
}

export interface ApostilaInsert {
  titulo: string;
  descricao?: string;
  concurso_id: string;
  categoria_id: string;
  ativo?: boolean;
  usuario_id: string;
}

export interface ApostilaUpdate {
  titulo?: string;
  descricao?: string;
  concurso_id?: string;
  categoria_id?: string;
  ativo?: boolean;
}

export interface ApostilaContent {
  id: string;
  apostila_id: string;
  module_number: number;
  titulo: string;
  content_json: unknown;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
  ordem: number;
}

export interface ApostilaContentInsert {
  apostila_id: string;
  module_number: number;
  titulo: string;
  content_json: unknown;
  ativo?: boolean;
  ordem?: number;
}

export interface ApostilaContentUpdate {
  module_number?: number;
  titulo?: string;
  content_json?: unknown;
  ativo?: boolean;
  ordem?: number;
}

export interface UserApostilaProgress {
  id: string;
  usuario_id: string;
  apostila_id: string;
  module_id: string;
  percentual_progresso: number;
  concluido_at?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface UserApostilaProgressInsert {
  usuario_id: string;
  apostila_id: string;
  module_id: string;
  percentual_progresso: number;
  concluido_at?: string;
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
    ativo?: boolean;
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

    if (filters?.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
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
        atualizado_em: new Date().toISOString()
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
        conteudo_apostila(*)
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



