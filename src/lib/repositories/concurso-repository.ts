import { getLogger } from '@/src/lib/logging';
import { CachedRepository } from '@/src/lib/repositories/base';
import { DatabaseError, NotFoundError } from '@/src/lib/errors';
import { getSupabase } from '@/src/lib/supabase';
import type { Tables } from '@/types/supabase.types';

const logger = getLogger('ConcursoRepository');

/**
 * Concurso type
 */
export type Concurso = Tables<'concursos'>;

/**
 * Concurso input type
 */
export interface ConcursoInput {
  nome: string;
  slug: string;
  descricao?: string;
  ano?: number;
  banca?: string;
  categoria_id?: string;
  url_edital?: string; // CORRETO conforme schema
  data_prova?: string;
  vagas?: number;
  salario?: number;
  nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
  multiplicador_questoes?: number;
  ativo?: boolean;
}

/**
 * Concurso filters type
 */
export type ConcursoFiltros = {
  ativo?: boolean;
  search?: string;
  categoria_id?: string | null;
  ano?: number | null;
  banca?: string | null;
};



/**
 * Map database concurso to API format
 * @param concurso Database concurso
 * @returns API concurso
 */
function mapDatabaseToApi(concurso: Record<string, unknown>): Concurso {
  return {
    id: concurso.id as string,
    nome: concurso.nome as string,
    slug: concurso.slug as string,
    descricao: concurso.descricao as string,
    ano: concurso.ano as number,
    banca: concurso.banca as string,
    categoria_id: concurso.categoria_id as string,
    edital_url: concurso.url_edital as string, // Mapear url_edital do DB para edital_url do tipo
    data_prova: concurso.data_prova as string,
    vagas: concurso.vagas as number,
    salario: concurso.salario as number,
    nivel_dificuldade: concurso.nivel_dificuldade as 'facil' | 'medio' | 'dificil',
    multiplicador_questoes: concurso.multiplicador_questoes as number,
    ativo: concurso.ativo as boolean,
    criado_em: concurso.criado_em as string,
    atualizado_em: concurso.atualizado_em as string
  };
}

/**
 * Repository for managing concursos
 */
export class ConcursoRepository extends CachedRepository<Concurso> {
  /**
   * Create a new concurso repository
   */
  constructor() {
    super('concursos', {
      ttl: 300000, // 5 minutes
      cacheById: true,
      cacheAll: true
    });
  }
  
  /**
   * Find active concursos
   * @returns Array of active concursos
   */
  async findAtivos(): Promise<Concurso[]> {
    try {
      const result = await this.findAll({ ativo: true });
      return result.map(mapDatabaseToApi);
    } catch (error) {
      logger.error('Error in findAtivos', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find active concursos', { cause: error as Error });
    }
  }
  
  /**
   * Find a concurso by slug
   * @param slug Concurso slug
   * @returns Concurso or null if not found
   */
  async findBySlug(slug: string): Promise<Concurso | null> {
    try {
      const { data, error } = await getSupabase()
        .from('concursos')
        .select('*, categoria:categorias(*)')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to find concurso by slug', { error, slug });
        throw new DatabaseError(`Failed to find concurso by slug: ${ error.message}`);
      }
      
      return mapDatabaseToApi(data);
    } catch (error) {
      logger.error('Error in findBySlug', { error, slug });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find concurso by slug', { cause: error as Error });
    }
  }
  
  /**
   * Find a concurso by ID with category
   * @param id Concurso ID
   * @returns Concurso or null if not found
   */
  async findByIdWithCategory(id: string): Promise<Concurso | null> {
    try {
      const { data, error } = await getSupabase()
        .from('concursos')
        .select('*, categoria:categorias(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to find concurso by ID with category', { error, id });
        throw new DatabaseError(`Failed to find concurso by ID with category: ${ error.message}`);
      }
      
      return mapDatabaseToApi(data);
    } catch (error) {
      logger.error('Error in findByIdWithCategory', { error, id });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find concurso by ID with category', { cause: error as Error });
    }
  }
  
  /**
   * Create a new concurso
   * @param dados Concurso data
   * @returns Created concurso
   */
  async criarConcurso(dados: ConcursoInput): Promise<Concurso> {
    try {
      // Generate slug if not provided
      if (!dados.slug && dados.nome) {
        dados.slug = dados.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');
      }
      
      // Set default values
      const now = new Date().toISOString();
      const concursoData = {
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        ano: dados.ano ?? null,
        banca: dados.banca ?? null,
        ativo: dados.ativo ?? true,
        criado_em: now,
        atualizado_em: now,
        categoria_id: dados.categoria_id ?? null,
        edital_url: dados.url_edital ?? null,
        data_prova: dados.data_prova ?? null,
        vagas: dados.vagas ?? null,
        salario: dados.salario ?? null,
        multiplicador_questoes: dados.multiplicador_questoes ?? 1,
        nivel_dificuldade: dados.nivel_dificuldade ?? 'medio',
        slug: dados.slug ?? ''
      };
      
      const result = await this.create(concursoData);
      return mapDatabaseToApi(result);
    } catch (error) {
      logger.error('Error in criarConcurso', { error, dados });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to create concurso', { cause: error as Error });
    }
  }
  
  /**
   * Update a concurso
   * @param id Concurso ID
   * @param dados Concurso data
   * @returns Updated concurso
   */
  async atualizarConcurso(id: string, dados: Partial<ConcursoInput>): Promise<Concurso> {
    try {
      // Check if concurso exists
      const existingConcurso = await this.findById(id);
      
      if (!existingConcurso) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      // Update concurso
      const concursoData = {
        ...dados,
        atualizado_em: new Date().toISOString()
      };
      
      const result = await this.update(id, concursoData);
      
      if (!result) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      return mapDatabaseToApi(result);
    } catch (error) {
      logger.error('Error in atualizarConcurso', { error, id, dados });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to update concurso', { cause: error as Error });
    }
  }
  
  /**
   * Deactivate a concurso
   * @param id Concurso ID
   * @returns Deactivated concurso
   */
  async desativarConcurso(id: string): Promise<Concurso> {
    try {
      // Check if concurso exists
      const existingConcurso = await this.findById(id);
      
      if (!existingConcurso) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      // Update concurso
      const result = await this.update(id, {
        ativo: false,
        atualizado_em: new Date().toISOString()
      });
      
      if (!result) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      return mapDatabaseToApi(result);
    } catch (error) {
      logger.error('Error in desativarConcurso', { error, id });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to deactivate concurso', { cause: error as Error });
    }
  }
  
  /**
   * Activate a concurso
   * @param id Concurso ID
   * @returns Activated concurso
   */
  async ativarConcurso(id: string): Promise<Concurso> {
    try {
      // Check if concurso exists
      const existingConcurso = await this.findById(id);
      
      if (!existingConcurso) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      // Update concurso
      const result = await this.update(id, {
        ativo: true,
        atualizado_em: new Date().toISOString()
      });
      
      if (!result) {
        throw new NotFoundError(`Concurso with ID ${id} not found`);
      }
      
      return mapDatabaseToApi(result);
    } catch (error) {
      logger.error('Error in ativarConcurso', { error, id });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to activate concurso', { cause: error as Error });
    }
  }
  
  /**
   * Find concursos with filters
   * @param filtros Filters
   * @returns Array of concursos
   */
  async buscarComFiltros(filtros: Record<string, string | boolean | number> = {}): Promise<Concurso[]> {
    try {
      // Convert filters to Supabase format
      const filters: Record<string, unknown> = {};
      
      // Handle special filters
      if (filtros.search) {
        // Search by name or description
        const searchTerm = String(filtros.search).toLowerCase();
        
        // Use ilike for case-insensitive search
        const { data, error } = await getSupabase()
          .from('concursos')
          .select('*, categoria:categorias(*)')
          .or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
        
        if (error) {
          logger.error('Failed to search concursos', { error, searchTerm });
          throw new DatabaseError(`Failed to search concursos: ${ error.message}`);
        }
        
        return (data || []).map(mapDatabaseToApi);
      }
      
      // Handle regular filters
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'search') {
          filters[key] = value;
        }
      });
      
      // Get concursos with filters
      const result = await this.findAll(filters);
      return result.map(mapDatabaseToApi);
    } catch (error) {
      logger.error('Error in buscarComFiltros', { error, filtros });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find concursos with filters', { cause: error as Error });
    }
  }
  
  /**
   * Find concursos by category
   * @param categoriaId Category ID
   * @returns Array of concursos
   */
  async findByCategoria(categoriaId: string): Promise<Concurso[]> {
    try {
      const result = await this.findAll({ categoria_id: categoriaId });
      return result.map(mapDatabaseToApi);
    } catch (error) {
      logger.error('Error in findByCategoria', { error, categoriaId });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find concursos by category', { cause: error as Error });
    }
  }
  
  /**
   * Find concursos by banca
   * @param banca Banca name
   * @returns Array of concursos
   */
  async findByBanca(banca: string): Promise<Concurso[]> {
    try {
      const result = await this.findAll({ banca });
      return result.map(mapDatabaseToApi);
    } catch (error) {
      logger.error('Error in findByBanca', { error, banca });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find concursos by banca', { cause: error as Error });
    }
  }
  
  /**
   * Get concurso statistics
   * @returns Concurso statistics
   */
  async getEstatisticas(): Promise<{
    total: number;
    ativos: number;
    porCategoria: { categoria_id: string; nome: string; total: number }[];
  }> {
    try {
      // Get total count
      const total = await this.count();
      
      // Get active count
      const ativos = await this.count({ ativo: true });
      
      // Get count by category
      const { data, error } = await getSupabase()
        .from('concursos')
        .select('categoria_id, categorias:categorias(nome)');
      
      if (error) {
        logger.error('Failed to get concurso statistics', { error });
        throw new DatabaseError(`Failed to get concurso statistics: ${ error.message}`);
      }
      
      // Group by category
      const categoryCounts: Record<string, { categoria_id: string; nome: string; total: number }> = {};
      
      for (const item of data) {
        const categoriaId = item.categoria_id;
        const nome = Array.isArray(item.categorias) ? ((item.categorias as unknown as { nome: string }[])[0]?.nome || 'Sem categoria') : ((item.categorias as unknown as { nome: string })?.nome || 'Sem categoria');
        
        if (!categoriaId) continue;
        
        if (!categoryCounts[categoriaId]) {
          categoryCounts[categoriaId] = {
            categoria_id: categoriaId,
            nome,
            total: 0
          };
        }
        
        categoryCounts[categoriaId].total++;
      }
      
      return {
        total,
        ativos,
        porCategoria: Object.values(categoryCounts)
      };
    } catch (error) {
      logger.error('Error in getEstatisticas', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get concurso statistics', { cause: error as Error });
    }
  }
}

// Export singleton instance
export const concursoRepository = new ConcursoRepository();
export default concursoRepository;