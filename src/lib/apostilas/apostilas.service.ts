// Tipos locais para o serviço de apostilas
type Apostila = {
  id: string;
  titulo: string;
  descricao?: string;
  concurso_id: string;
  categoria_id?: string;
  usuario_id: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

type ApostilaInsert = Omit<Apostila, 'id' | 'criado_em' | 'atualizado_em'>;
type ApostilaUpdate = Partial<Omit<Apostila, 'id' | 'criado_em' | 'usuario_id'>>;

/**
 * Serviço para gerenciar apostilas
 * Fornece métodos para operações CRUD em apostilas via API
 */
class ApostilasService {
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
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters?.concursoId && { concursoId: filters.concursoId }),
        ...(filters?.categoriaId && { categoriaId: filters.categoriaId }),
        ...(filters?.searchTerm && { searchTerm: filters.searchTerm }),
      });

      const res = await fetch(`/api/apostilas?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar apostilas');
      
      const data = await res.json();
      return {
        data: data.data || [],
        count: data.count || 0,
      };
    } catch (error) {
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
      const res = await fetch(`/api/apostilas/${id}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Erro ao buscar apostila');
      }
      return await res.json();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostila'
      );
    }
  }

  /**
   * Cria uma nova apostila
   */
  async create(apostila: Omit<ApostilaInsert, 'id' | 'criado_em' | 'atualizado_em' | 'usuario_id'>, usuarioId: string): Promise<Apostila> {
    try {
      const res = await fetch('/api/apostilas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...apostila,
          usuario_id: usuarioId,
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar apostila');
      return await res.json();
    } catch (error) {
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
    updates: Partial<Omit<ApostilaUpdate, 'id' | 'criado_em' | 'usuario_id'>>
  ): Promise<Apostila> {
    try {
      const res = await fetch(`/api/apostilas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Erro ao atualizar apostila');
      return await res.json();
    } catch (error) {
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
      const res = await fetch(`/api/apostilas/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao remover apostila');
    } catch (error) {
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
      const res = await fetch(`/api/apostilas?limit=${limit}&recent=true`);
      if (!res.ok) throw new Error('Erro ao buscar apostilas recentes');
      
      const data = await res.json();
      return data.data || [];
    } catch (error) {
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
      const res = await fetch(`/api/apostilas?concursoId=${encodeURIComponent(concursoId)}`);
      if (!res.ok) throw new Error('Erro ao buscar apostilas por concurso');
      
      const data = await res.json();
      return data.data || [];
    } catch (error) {
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
      const res = await fetch(`/api/apostilas?categoriaId=${encodeURIComponent(categoriaId)}`);
      if (!res.ok) throw new Error('Erro ao buscar apostilas por categoria');
      
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas por categoria'
      );
    }
  }

  /**
   * Busca apostilas por usuário
   */
  async findByUser(usuarioId: string): Promise<Apostila[]> {
    try {
      const res = await fetch(`/api/apostilas?usuarioId=${encodeURIComponent(usuarioId)}`);
      if (!res.ok) throw new Error('Erro ao buscar apostilas do usuário');
      
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao buscar apostilas do usuário'
      );
    }
  }
}

export const apostilasService = new ApostilasService();



