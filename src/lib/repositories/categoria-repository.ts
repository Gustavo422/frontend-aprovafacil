import { BaseRepository } from './base-repository';
import type { Database } from '@/types/supabase';

// Tipos específicos para o repositório de categorias
type CategoriaTable = Database['public']['Tables']['concurso_categorias'];
type CategoriaRow = CategoriaTable['Row'];
type CategoriaInsert = CategoriaTable['Insert'];
type CategoriaUpdate = CategoriaTable['Update'];

// Tipos para filtros de categorias
export type CategoriaFiltros = {
  ativo?: boolean;
  search?: string;
  parentId?: string | null;
};

// Tipo para o resultado da verificação de exclusão
type PodeExcluirResult = {
  podeExcluir: boolean;
  motivo?: string;
};

export class CategoriaRepository extends BaseRepository<'concurso_categorias'> {
  constructor() {
    super('concurso_categorias');
  }

  /**
   * Busca categorias ativas
   * @returns Lista de categorias ativas ordenadas por nome
   */
  async findAtivas(): Promise<CategoriaRow[]> {
    const { data, error } = await this.client
      .from('concurso_categorias')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Busca uma categoria pelo seu slug
   * @param slug Slug da categoria
   * @returns A categoria encontrada ou null se não existir
   */
  async findBySlug(slug: string): Promise<CategoriaRow | null> {
    const { data, error } = await this.client
      .from('concurso_categorias')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Nenhum registro encontrado
        return null;
      }
      throw error;
    }
    return data;
  }

  /**
   * Cria uma nova categoria
   * @param dados Dados da categoria a ser criada
   * @returns A categoria criada
   */
  async criarCategoria(
    dados: Omit<CategoriaInsert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CategoriaRow> {
    return this.create({
      ...dados,
      is_active: dados.is_active ?? true,
      cor_primaria: dados.cor_primaria || '#2563EB',
      cor_secundaria: dados.cor_secundaria || '#1E40AF',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Atualiza uma categoria existente
   * @param id ID da categoria a ser atualizada
   * @param dados Dados para atualização
   * @returns A categoria atualizada
   */
  async atualizarCategoria(
    id: string, 
    dados: Partial<Omit<CategoriaUpdate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<CategoriaRow> {
    return this.update(id, {
      ...dados,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Desativa uma categoria
   * @param id ID da categoria a ser desativada
   * @returns A categoria desativada
   */
  async desativarCategoria(id: string): Promise<CategoriaRow> {
    return this.update(id, {
      is_active: false,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Ativa uma categoria
   * @param id ID da categoria a ser ativada
   * @returns A categoria ativada
   */
  async ativarCategoria(id: string): Promise<CategoriaRow> {
    return this.update(id, {
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Busca categorias com base em filtros
   * @param filtros Filtros para a busca
   * @returns Lista de categorias que atendem aos filtros
   */
  async buscarComFiltros(filtros: CategoriaFiltros = {}): Promise<CategoriaRow[]> {
    let query = this.client
      .from('concurso_categorias')
      .select('*');

    // Aplicar filtros
    if (filtros.ativo !== undefined) {
      query = query.eq('is_active', filtros.ativo);
    }

    if (filtros.search) {
      query = query.ilike('nome', `%${filtros.search}%`);
    }

    if (filtros.parentId !== undefined) {
      query = query.eq('parent_id', filtros.parentId);
    }

    // Ordenar por nome por padrão
    query = query.order('nome', { ascending: true });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Busca categorias filhas de uma categoria pai
   * @param parentId ID da categoria pai (null para categorias raiz)
   * @returns Lista de categorias filhas
   */
  async findByParentId(parentId: string | null): Promise<CategoriaRow[]> {
    const { data, error } = await this.client
      .from('concurso_categorias')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca a árvore completa de categorias
   * @returns Lista de categorias organizadas em árvore
   */
  async findArvoreCategorias(): Promise<CategoriaRow[]> {
    // Primeiro busca todas as categorias ativas
    const { data: categorias, error } = await this.client
      .from('concurso_categorias')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    if (!categorias) return [];

    // Filtra as categorias raiz (sem parent_id)
    const categoriasRaiz = categorias.filter(cat => !cat.parent_id);
    
    // Função recursiva para construir a árvore
    const construirArvore = (paiId: string | null): CategoriaRow[] => {
      const filhos = categorias.filter(cat => cat.parent_id === paiId);
      return filhos.map(filho => ({
        ...filho,
        filhos: construirArvore(filho.id)
      }));
    };

    // Constrói a árvore a partir das raízes
    return categoriasRaiz.map(raiz => ({
      ...raiz,
      filhos: construirArvore(raiz.id)
    }));
  }

  /**
   * Verifica se uma categoria pode ser excluída (não tem concursos vinculados)
   * @param id ID da categoria a ser verificada
   * @returns Objeto indicando se pode excluir e um motivo em caso negativo
   */
  async podeExcluirCategoria(id: string): Promise<PodeExcluirResult> {
    // Verifica se existem concursos vinculados a esta categoria
    const { data: concursos, error: concursosError } = await this.client
      .from('concursos')
      .select('id', { count: 'exact' })
      .eq('categoria_id', id);

    if (concursosError) throw concursosError;

    if (concursos && concursos.length > 0) {
      return { 
        podeExcluir: false, 
        motivo: 'Existem concursos vinculados a esta categoria. Desative a categoria em vez de excluí-la.' 
      };
    }

    // Verifica se existem subcategorias ativas
    const { data: subcategorias, error: subcategoriasError } = await this.client
      .from('concurso_categorias')
      .select('id', { count: 'exact' })
      .eq('parent_id', id)
      .eq('is_active', true);

    if (subcategoriasError) throw subcategoriasError;

    if (subcategorias && subcategorias.length > 0) {
      return { 
        podeExcluir: false, 
        motivo: 'Existem subcategorias ativas vinculadas a esta categoria. Desative ou remova as subcategorias primeiro.' 
      };
    }

    return { podeExcluir: true };
  }
}
