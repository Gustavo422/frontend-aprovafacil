import { getLogger } from '@/src/lib/logging';
import { CachedRepository } from '@/src/lib/repositories/base';
import { DatabaseError, NotFoundError } from '@/src/lib/errors';
import { supabase } from '@/src/lib/supabase';
// import type { Database } from '@/types/supabase.types';

const logger = getLogger('CategoriaRepository');

/**
 * Categoria type
 */
export type Categoria = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  cor_primaria?: string;
  cor_secundaria?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  disciplinas?: Disciplina[];
  parent_id?: string | null; // Adicionado para evitar erro de parent_id
};

/**
 * Disciplina type
 */
export type Disciplina = {
  id: string;
  categoria_id: string;
  nome: string;
  peso: number;
  horas_semanais: number;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

/**
 * Categoria filters type
 */
export type CategoriaFiltros = {
  ativo?: boolean;
  search?: string;
  parentId?: string | null;
};

/**
 * Result of checking if a categoria can be deleted
 */
export type PodeExcluirResult = {
  podeExcluir: boolean;
  motivo?: string;
};

/**
 * Categoria input type
 */
export type CategoriaInput = {
  nome: string;
  slug?: string;
  descricao?: string | null;
  cor_primaria?: string;
  cor_secundaria?: string;
  ativo?: boolean;
  disciplinas?: Partial<Disciplina>[];
};

// Tipos temporários para evitar erro de compilação
type CategoriaRow = {
  id: string;
  nome: string;
  descricao?: string | null;
  criado_em: string;
  atualizado_em: string;
  concurso_id?: string | null;
};

type CategoriaInsert = {
  nome: string;
  descricao?: string | null;
  concurso_id?: string | null;
  slug?: string;
  cor_primaria?: string | null;
  cor_secundaria?: string | null;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string;
};

type CategoriaUpdate = {
  nome?: string;
  descricao?: string | null;
  concurso_id?: string | null;
  atualizado_em?: string;
};

type DisciplinaInsert = {
  nome: string;
  categoria_id: string;
  descricao?: string | null;
};

/**
 * Repository for managing categorias
 */
export class CategoriaRepository extends CachedRepository<Categoria> {
  /**
   * Create a new categoria repository
   */
  constructor() {
    super('categorias', {
      ttl: 300000, // 5 minutes
      cacheById: true,
      cacheAll: true
    });
  }
  
  /**
   * Find active categorias
   * @returns Array of active categorias
   */
  async findAtivas(): Promise<Categoria[]> {
    try {
      return await this.findAll({ ativo: true });
    } catch (error) {
      logger.error('Error in findAtivas', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find active categorias', { cause: error as Error });
    }
  }
  
  /**
   * Find a categoria by slug
   * @param slug Categoria slug
   * @returns Categoria or null if not found
   */
  async findBySlug(slug: string): Promise<Categoria | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)('categorias_concursos')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to find categoria by slug', { error, slug });
        throw new DatabaseError(`Failed to find categoria by slug: ${ error.message}`);
      }
      
      return data as unknown as Categoria | null;
    } catch (error) {
      logger.error('Error in findBySlug', { error, slug });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find categoria by slug', { cause: error as Error });
    }
  }
  
  /**
   * Create a new categoria
   * @param dados Categoria data
   * @returns Created categoria
   */
  async criarCategoria(dados: CategoriaInput): Promise<Categoria> {
    try {
      // Generate slug if not provided
      if (!dados.slug && dados.nome) {
        dados.slug = dados.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[ -\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');
      }
      // Garantir que slug está presente e é string
      if (!dados.slug) {
        throw new DatabaseError('Slug é obrigatório para criar categoria');
      }
      // Extract disciplinas
      const disciplinas = dados.disciplinas || [];
      const categoriaData: CategoriaInsert = {
        nome: dados.nome,
        slug: dados.slug,
        descricao: dados.descricao ?? null,
        cor_primaria: dados.cor_primaria ?? null,
        cor_secundaria: dados.cor_secundaria ?? null,
        ativo: dados.ativo !== undefined ? dados.ativo : true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      // Start transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categoria, error: categoriaError } = await (supabase.from as any)('categorias_concursos')
        .insert(categoriaData)
        .select()
        .single();
      
      if (categoriaError) {
        logger.error('Failed to create categoria', { error: categoriaError });
        throw new DatabaseError(`Failed to create categoria: ${ categoriaError.message}`);
      }
      // Checagem de tipo para garantir que categoria possui id
      if (!categoria || typeof categoria !== 'object' || !('id' in categoria)) {
        logger.error('Insert de categoria retornou resultado inesperado', { categoria });
        throw new DatabaseError('Insert de categoria retornou resultado inesperado');
      }
      // Add disciplinas if provided
      if (disciplinas.length > 0) {
        const disciplinasData: DisciplinaInsert[] = disciplinas.map((disciplina, index) => ({
          nome: disciplina.nome ?? '',
          categoria_id: (categoria as CategoriaRow).id,
          ordem: disciplina.ordem || index + 1,
          peso: disciplina.peso ?? 1,
          horas_semanais: disciplina.horas_semanais ?? 1,
          ativo: disciplina.ativo !== undefined ? disciplina.ativo : true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: disciplinasError } = await (supabase.from as any)('disciplinas_categoria')
          .insert(disciplinasData);
        if (disciplinasError) {
          logger.error('Failed to create disciplinas', { error: disciplinasError });
          throw new DatabaseError(`Failed to create disciplinas: ${ disciplinasError.message}`);
        }
      }
      // Get categoria with disciplinas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: getError } = await (supabase.from as any)('categorias_concursos')
        .select('*')
        .eq('id', (categoria as CategoriaRow).id)
        .single();
      if (getError) {
        logger.error('Failed to get created categoria', { error: getError });
        throw new DatabaseError(`Failed to get created categoria: ${ getError.message}`);
      }
      // Invalidate cache
      this.invalidateAllCaches();
      return result as unknown as Categoria;
    } catch (error) {
      logger.error('Error in criarCategoria', { error, dados });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to create categoria', { cause: error as Error });
    }
  }
  
  /**
   * Update a categoria
   * @param id Categoria ID
   * @param dados Categoria data
   * @returns Updated categoria
   */
  async atualizarCategoria(id: string, dados: Partial<CategoriaInput>): Promise<Categoria> {
    try {
      // Check if categoria exists
      const existingCategoria = await this.findById(id);
      
      if (!existingCategoria) {
        throw new NotFoundError(`Categoria with ID ${id} not found`);
      }
      
      // Extract disciplinas
      const disciplinas = dados.disciplinas;
      const categoriaData: CategoriaUpdate = {
        ...dados,
        atualizado_em: new Date().toISOString()
      };
      
      // Update categoria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: categoriaError } = await (supabase.from as any)('categorias_concursos')
        .update(categoriaData)
        .eq('id', id)
        .select()
        .single();
      
      if (categoriaError) {
        logger.error('Failed to update categoria', { error: categoriaError });
        throw new DatabaseError(`Failed to update categoria: ${ categoriaError.message}`);
      }
      
      // Update disciplinas if provided
      if (disciplinas && disciplinas.length > 0) {
        // Get existing disciplinas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingDisciplinas, error: getDisciplinasError } = await (supabase.from as any)('disciplinas_categoria')
          .select('*')
          .eq('categoria_id', id);
        
        if (getDisciplinasError) {
          logger.error('Failed to get existing disciplinas', { error: getDisciplinasError });
          throw new DatabaseError(`Failed to get existing disciplinas: ${ getDisciplinasError.message}`);
        }
        
        // Process disciplinas
        for (const disciplina of disciplinas) {
          if (disciplina.id) {
            // Update existing disciplina
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (supabase.from as any)('disciplinas_categoria')
              .update({
                ...disciplina,
                atualizado_em: new Date().toISOString()
              })
              .eq('id', disciplina.id)
              .eq('categoria_id', id);
            
            if (updateError) {
              logger.error('Failed to update disciplina', { error: updateError });
              throw new DatabaseError(`Failed to update disciplina: ${ updateError.message}`);
            }
          } else {
            // Create new disciplina
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: insertError } = await (supabase.from as any)('disciplinas_categoria')
              .insert({
                nome: disciplina.nome ?? '',
                categoria_id: id,
                ordem: disciplina.ordem || (existingDisciplinas?.length || 0) + 1,
                peso: disciplina.peso ?? 1,
                horas_semanais: disciplina.horas_semanais ?? 1,
                ativo: disciplina.ativo !== undefined ? disciplina.ativo : true,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
              });
            
            if (insertError) {
              logger.error('Failed to create disciplina', { error: insertError });
              throw new DatabaseError(`Failed to create disciplina: ${ insertError.message}`);
            }
          }
        }
      }
      
      // Get updated categoria with disciplinas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: getError } = await (supabase.from as any)('categorias_concursos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (getError) {
        logger.error('Failed to get updated categoria', { error: getError });
        throw new DatabaseError(`Failed to get updated categoria: ${ getError.message}`);
      }
      
      // Invalidate cache
      this.invalidateByIdCache(id);
      this.invalidateAllCache();
      
      return result as unknown as Categoria;
    } catch (error) {
      logger.error('Error in atualizarCategoria', { error, id, dados });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to update categoria', { cause: error as Error });
    }
  }
  
  /**
   * Deactivate a categoria
   * @param id Categoria ID
   * @returns Deactivated categoria
   */
  async desativarCategoria(id: string): Promise<Categoria> {
    try {
      // Check if categoria exists
      const existingCategoria = await this.findById(id);
      
      if (!existingCategoria) {
        throw new NotFoundError(`Categoria with ID ${id} not found`);
      }
      
      // Update categoria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)('categorias_concursos')
        .update({
          ativo: false,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        logger.error('Failed to deactivate categoria', { error });
        throw new DatabaseError(`Failed to deactivate categoria: ${ error.message}`);
      }
      
      // Invalidate cache
      this.invalidateByIdCache(id);
      this.invalidateAllCache();
      
      return data as unknown as Categoria;
    } catch (error) {
      logger.error('Error in desativarCategoria', { error, id });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to deactivate categoria', { cause: error as Error });
    }
  }
  
  /**
   * Activate a categoria
   * @param id Categoria ID
   * @returns Activated categoria
   */
  async ativarCategoria(id: string): Promise<Categoria> {
    try {
      // Check if categoria exists
      const existingCategoria = await this.findById(id);
      
      if (!existingCategoria) {
        throw new NotFoundError(`Categoria with ID ${id} not found`);
      }
      
      // Update categoria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)('categorias_concursos')
        .update({
          ativo: true,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        logger.error('Failed to activate categoria', { error });
        throw new DatabaseError(`Failed to activate categoria: ${ error.message}`);
      }
      
      // Invalidate cache
      this.invalidateByIdCache(id);
      this.invalidateAllCache();
      
      return data as unknown as Categoria;
    } catch (error) {
      logger.error('Error in ativarCategoria', { error, id });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to activate categoria', { cause: error as Error });
    }
  }
  
  /**
   * Find categorias with filters
   * @param filtros Filters
   * @returns Array of categorias
   */
  async buscarComFiltros(filtros: Record<string, string | boolean> = {}): Promise<Categoria[]> {
    try {
      // Convert filters to Supabase format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from as any)('categorias_concursos')
        .select('*');
      
      // Apply filters
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'search') {
            // Search by name or description
            const searchTerm = String(value).toLowerCase();
            query = query.or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
          } else if (key === 'parentId') {
            // Filter by parent ID
            if (value === '') {
              query = query.is('parent_id', null);
            } else {
              query = query.eq('parent_id', value);
            }
          } else {
            // Regular filter
            query = query.eq(key, value);
          }
        }
      });
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to find categorias with filters', { error, filtros });
        throw new DatabaseError(`Failed to find categorias with filters: ${ error.message}`);
      }
      
      return data as unknown as Categoria[];
    } catch (error) {
      logger.error('Error in buscarComFiltros', { error, filtros });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find categorias with filters', { cause: error as Error });
    }
  }
  
  /**
   * Find categorias by parent ID
   * @param parentId Parent ID
   * @returns Array of categorias
   */
  async findByParentId(parentId: string | null): Promise<Categoria[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from as any)('categorias_concursos')
        .select('*');
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to find categorias by parent ID', { error, parentId });
        throw new DatabaseError(`Failed to find categorias by parent ID: ${ error.message}`);
      }
      
      return data as unknown as Categoria[];
    } catch (error) {
      logger.error('Error in findByParentId', { error, parentId });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find categorias by parent ID', { cause: error as Error });
    }
  }
  
  /**
   * Find the complete categoria tree
   * @returns Array of categorias
   */
  async findArvoreCategorias(): Promise<Categoria[]> {
    try {
      // Get all categorias
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)('categorias_concursos')
        .select('*')
        .order('nome');
      
      if (error) {
        logger.error('Failed to find categoria tree', { error });
        throw new DatabaseError(`Failed to find categoria tree: ${ error.message}`);
      }
      
      // Build tree
      const categorias = data as unknown as Categoria[];
      const categoriasMap = new Map<string, Categoria & { children?: Categoria[] }>();
      const rootCategorias: (Categoria & { children?: Categoria[] })[] = [];
      
      // Create map of categorias
      categorias.forEach(categoria => {
        categoriasMap.set(categoria.id, { ...categoria, children: [] });
      });
      
      // Build tree structure
      categorias.forEach(categoria => {
        const categoriaWithChildren = categoriasMap.get(categoria.id)!;
        
        if (categoria.parent_id) {
          // Add to parent's children
          const parent = categoriasMap.get(categoria.parent_id);
          
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoriaWithChildren);
          } else {
            // Parent not found, add to root
            rootCategorias.push(categoriaWithChildren);
          }
        } else {
          // Add to root
          rootCategorias.push(categoriaWithChildren);
        }
      });
      
      return rootCategorias;
    } catch (error) {
      logger.error('Error in findArvoreCategorias', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find categoria tree', { cause: error as Error });
    }
  }
  
  /**
   * Check if a categoria can be deleted
   * @param id Categoria ID
   * @returns Result of the check
   */
  async podeExcluirCategoria(id: string): Promise<PodeExcluirResult> {
    try {
      // Check if categoria exists
      const existingCategoria = await this.findById(id);
      
      if (!existingCategoria) {
        throw new NotFoundError(`Categoria with ID ${id} not found`);
      }
      
      // Check if categoria has children
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: children, error: childrenError } = await (supabase.from as any)('categorias_concursos')
        .select('id')
        .eq('parent_id', id);
      
      if (childrenError) {
        logger.error('Failed to check categoria children', { error: childrenError });
        throw new DatabaseError(`Failed to check categoria children: ${ childrenError.message}`);
      }
      
      if (children && children.length > 0) {
        return {
          podeExcluir: false,
          motivo: 'Categoria possui subcategorias'
        };
      }
      
      // Check if categoria has concursos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: concursos, error: concursosError } = await (supabase.from as any)('concursos')
        .select('id')
        .eq('categoria_id', id);
      
      if (concursosError) {
        logger.error('Failed to check categoria concursos', { error: concursosError });
        throw new DatabaseError(`Failed to check categoria concursos: ${ concursosError.message}`);
      }
      
      if (concursos && concursos.length > 0) {
        return {
          podeExcluir: false,
          motivo: 'Categoria possui concursos associados'
        };
      }
      
      // Check if categoria has disciplinas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: disciplinas, error: disciplinasError } = await (supabase.from as any)('disciplinas_categoria')
        .select('id')
        .eq('categoria_id', id);
      
      if (disciplinasError) {
        logger.error('Failed to check categoria disciplinas', { error: disciplinasError });
        throw new DatabaseError(`Failed to check categoria disciplinas: ${ disciplinasError.message}`);
      }
      
      if (disciplinas && disciplinas.length > 0) {
        return {
          podeExcluir: false,
          motivo: 'Categoria possui disciplinas associadas'
        };
      }
      
      // Can delete
      return {
        podeExcluir: true
      };
    } catch (error) {
      logger.error('Error in podeExcluirCategoria', { error, id });
      
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to check if categoria can be deleted', { cause: error as Error });
    }
  }
}

// Export singleton instance
export const categoriaRepository = new CategoriaRepository();
export default categoriaRepository;
