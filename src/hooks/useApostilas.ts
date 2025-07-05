import { useState, useCallback, useEffect } from 'react';
import { apostilasService } from '@/lib/apostilas/apostilas.service';
import type { Apostila } from '@/types/supabase.types';

interface ApostilasFilters {
  concursoId?: string;
  categoriaId?: string;
  searchTerm?: string;
}

/**
 * Hook personalizado para gerenciar o estado das apostilas
 * Fornece métodos para buscar, criar, atualizar e remover apostilas
 */
export function useApostilas(initialFilters: ApostilasFilters = {}) {
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState<ApostilasFilters>(initialFilters);
  const pageSize = 10; // Número de itens por página

  /**
   * Carrega as apostilas com base nos filtros e página atuais
   */
  const loadApostilas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, count } = await apostilasService.findAll(
        page,
        pageSize,
        filters
      );
      
      setApostilas(data);
      setTotalCount(count || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar apostilas');
      setError(error);
      console.error('Erro ao carregar apostilas:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters, pageSize]);

  // Carrega as apostilas quando o hook é montado ou quando os filtros/página mudam
  useEffect(() => {
    loadApostilas();
  }, [loadApostilas]);

  /**
   * Cria uma nova apostila
   */
  const createApostila = async (apostilaData: Omit<Apostila, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'is_active'>, userId: string) => {
    try {
      setLoading(true);
      const novaApostila = await apostilasService.create(apostilaData, userId);
      
      // Atualiza a lista localmente
      setApostilas(prev => [novaApostila, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return novaApostila;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar apostila');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza uma apostila existente
   */
  const updateApostila = async (id: string, updates: Partial<Apostila>) => {
    try {
      setLoading(true);
      const apostilaAtualizada = await apostilasService.update(id, updates);
      
      // Atualiza a lista localmente
      setApostilas(prev => 
        prev.map(apostila => 
          apostila.id === id ? { ...apostila, ...apostilaAtualizada } : apostila
        )
      );
      
      return apostilaAtualizada;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar apostila');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove uma apostila (soft delete)
   */
  const removeApostila = async (id: string) => {
    try {
      setLoading(true);
      await apostilasService.remove(id);
      
      // Atualiza a lista localmente
      setApostilas(prev => prev.filter(apostila => apostila.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao remover apostila');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca apostilas por concurso
   */
  const fetchByConcurso = async (concursoId: string): Promise<Apostila[]> => {
    try {
      setLoading(true);
      const data = await apostilasService.findByConcurso(concursoId);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao buscar apostilas por concurso');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca apostilas por categoria
   */
  const fetchByCategoria = async (categoriaId: string): Promise<Apostila[]> => {
    try {
      setLoading(true);
      const data = await apostilasService.findByCategoria(categoriaId);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao buscar apostilas por categoria');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca as apostilas mais recentes
   */
  const fetchRecentes = async (limit: number = 5): Promise<Apostila[]> => {
    try {
      setLoading(true);
      const data = await apostilasService.findRecent(limit);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao buscar apostilas recentes');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza os filtros de busca
   */
  const updateFilters = (newFilters: Partial<ApostilasFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    // Volta para a primeira página ao mudar os filtros
    setPage(1);
  };

  /**
   * Muda para a página especificada
   */
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, newPage));
  };

  return {
    // Estado
    apostilas,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    filters,
    
    // Ações
    createApostila,
    updateApostila,
    removeApostila,
    fetchByConcurso,
    fetchByCategoria,
    fetchRecentes,
    updateFilters,
    goToPage,
    refresh: loadApostilas,
  };
}

export default useApostilas;
