import { BaseRepository } from './base-repository';
import type { Database } from '@/types/supabase';

// Tipos específicos para o repositório de concursos
type ConcursoTable = Database['public']['Tables']['concursos'];
type ConcursoRow = ConcursoTable['Row'];
type ConcursoInsert = ConcursoTable['Insert'];
type ConcursoUpdate = ConcursoTable['Update'];

// Tipos para filtros de concursos
type ConcursoFilters = {
  categoriaId?: string;
  banca?: string;
  ativo?: boolean;
  anoMinimo?: number;
  anoMaximo?: number;
};

export class ConcursoRepository extends BaseRepository<'concursos'> {
  constructor() {
    super('concursos');
  }

  /**
   * Busca concursos por categoria
   * @param categoriaId ID da categoria
   * @returns Lista de concursos da categoria especificada
   */
  async findByCategoria(categoriaId: string): Promise<ConcursoRow[]> {
    const { data, error } = await this.client
      .from('concursos')
      .select('*')
      .eq('categoria_id', categoriaId)
      .order('ano', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Busca concursos ativos
   * @returns Lista de concursos ativos ordenados por data de prova
   */
  async findAtivos(): Promise<ConcursoRow[]> {
    const { data, error } = await this.client
      .from('concursos')
      .select('*')
      .eq('is_active', true)
      .order('data_prova', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data;
  }

  /**
   * Busca concursos por banca
   * @param banca Nome ou parte do nome da banca
   * @returns Lista de concursos da banca especificada
   */
  async findByBanca(banca: string): Promise<ConcursoRow[]> {
    const { data, error } = await this.client
      .from('concursos')
      .select('*')
      .ilike('banca', `%${banca}%`)
      .order('ano', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Busca concursos com filtros avançados
   * @param filters Filtros para a busca
   * @returns Lista de concursos que atendem aos filtros
   */
  async buscarComFiltros(filters: ConcursoFilters): Promise<ConcursoRow[]> {
    let query = this.client
      .from('concursos')
      .select('*');

    if (filters.categoriaId) {
      query = query.eq('categoria_id', filters.categoriaId);
    }

    if (filters.banca) {
      query = query.ilike('banca', `%${filters.banca}%`);
    }

    if (filters.ativo !== undefined) {
      query = query.eq('is_active', filters.ativo);
    }

    if (filters.anoMinimo) {
      query = query.gte('ano', filters.anoMinimo);
    }

    if (filters.anoMaximo) {
      query = query.lte('ano', filters.anoMaximo);
    }

    const { data, error } = await query.order('ano', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  /**
   * Atualiza um concurso existente
   * @param id ID do concurso a ser atualizado
   * @param dados Dados para atualização
   * @returns O concurso atualizado
   */
  async atualizarConcurso(
    id: string, 
    dados: Partial<ConcursoUpdate>
  ): Promise<ConcursoRow> {
    return this.update(id, {
      ...dados,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Cria um novo concurso
   * @param dados Dados do concurso a ser criado
   * @returns O concurso criado
   */
  async criarConcurso(dados: ConcursoInsert): Promise<ConcursoRow> {
    return this.create({
      ...dados,
      is_active: dados.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Desativa um concurso
   * @param id ID do concurso a ser desativado
   * @returns O concurso desativado
   */
  async desativarConcurso(id: string): Promise<ConcursoRow> {
    return this.update(id, {
      is_active: false,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Ativa um concurso
   * @param id ID do concurso a ser ativado
   * @returns O concurso ativado
   */
  async ativarConcurso(id: string): Promise<ConcursoRow> {
    return this.update(id, {
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }
}
