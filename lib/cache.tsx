import { createServerSupabaseClient } from './supabase';
import { logger } from '@/lib/logger';

type CacheData = unknown;
type CacheKey = string;

/**
 * Define o nome da tabela de cache para ser usado em toda a aplicação.
 */
const CACHE_TABLE = 'cache_performance_usuario';

/**
 * Obtém dados do cache para um usuário específico.
 *
 * @param usuarioId - O ID do usuário.
 * @param key - A chave única para o item de cache.
 * @returns Os dados do cache ou nulo se não encontrado ou expirado.
 */
export async function getCache<T = CacheData>(
  usuarioId: string,
  key: CacheKey
): Promise<T | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select('dados_cache, expira_em')
      .eq('usuario_id', usuarioId)
      .eq('chave_cache', key)
      .single();

    if (error || !data) {
      return null;
    }

    if (new Date(data.expira_em) < new Date()) {
      await deleteCache(usuarioId, key);
      return null;
    }

    return data.dados_cache as T;
  } catch (error) {
    logger.error('Erro ao buscar do cache:', { error });
    return null;
  }
}

/**
 * Armazena dados no cache.
 *
 * @param usuarioId - O ID do usuário.
 * @param key - A chave única para o item de cache.
 * @param data - Os dados a serem armazenados.
 * @param ttlMinutes - O tempo de vida do cache em minutos.
 */
export async function setCache(
  usuarioId: string,
  key: CacheKey,
  data: CacheData,
  ttlMinutes = 30
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const expira_em = new Date(
      Date.now() + ttlMinutes * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from(CACHE_TABLE).upsert({
      usuario_id: usuarioId,
      chave_cache: key,
      dados_cache: data,
      expira_em,
      atualizado_em: new Date().toISOString(),
    });

    if (error) {
      logger.error('Erro ao salvar no cache:', { error });
    }
  } catch (error) {
    logger.error('Erro ao salvar no cache:', { error });
  }
}

/**
 * Remove um item específico do cache.
 *
 * @param usuarioId - O ID do usuário.
 * @param key - A chave do item a ser removido.
 */
export async function deleteCache(
  usuarioId: string,
  key: CacheKey
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('chave_cache', key);

    if (error) {
      logger.error('Erro ao deletar do cache:', { error });
    }
  } catch (error) {
    logger.error('Erro ao deletar do cache:', { error });
  }
}

/**
 * Limpa todo o cache de um usuário.
 *
 * @param usuarioId - O ID do usuário cujo cache será limpo.
 */
export async function clearUserCache(usuarioId: string): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .eq('usuario_id', usuarioId);

    if (error) {
      logger.error('Erro ao limpar cache do usuário:', { error });
    }
  } catch (error) {
    logger.error('Erro ao limpar cache do usuário:', { error });
  }
}

/**
 * Limpa todos os itens de cache expirados.
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .lt('expira_em', new Date().toISOString());

    if (error) {
      logger.error('Erro ao limpar cache expirado:', { error });
    }
  } catch (error) {
    logger.error('Erro ao limpar cache expirado:', { error });
  }
}

/**
 * Gera uma chave de cache padronizada.
 *
 * @param parts - As partes que compõem a chave.
 * @returns A chave de cache formatada.
 */
export function generateCacheKey(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join('_');
}

/**
 * Busca dados de desempenho diretamente do banco de dados.
 */
async function fetchPerformanceData(usuarioId: string, type: string, period?: string) {
  const supabase = await createServerSupabaseClient();

  // A lógica de busca permanece a mesma, mas agora com 'usuario_id'
  switch (type) {
    case 'simulados':
      return await fetchSimuladosData(supabase, usuarioId, period);
    case 'questoes':
      return await fetchQuestoesData(supabase, usuarioId, period);
    case 'disciplinas':
      return await fetchDisciplinasData(supabase, usuarioId);
    default:
      return null;
  }
}

/**
 * Busca dados de simulados do banco de dados.
 */
async function fetchSimuladosData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  usuarioId: string,
  period?: string
) {
  let query = supabase
    .from('progresso_usuario_simulado')
    .select(
      `
      *,
      simulados!inner(*)
    `
    )
    .eq('usuario_id', usuarioId); // CORRIGIDO

  if (period === 'week') {
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte('concluido_em', weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte('concluido_em', monthAgo);
  }

  const { data, error } = await query;
  
  if (error) {
    logger.error('Erro ao buscar dados de simulados:', { error });
    return null;
  }

  return {
    total: data.length,
    averageScore:
      data.length > 0
        ? data.reduce(
            (acc: number, item: unknown) => acc + ((item as Record<string, unknown>).pontuacao as number),
            0
          ) / data.length
        : 0,
    totalTime: data.reduce(
      (acc: number, item: unknown) => acc + ((item as Record<string, unknown>).tempo_gasto_minutos as number),
      0
    ),
  };
}

/**
 * Busca dados de questões do banco de dados.
 */
async function fetchQuestoesData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  usuarioId: string,
  period?: string
) {
  let query = supabase
    .from('progresso_usuario_questoes_semanais')
    .select(
      `
      *,
      questoes_semanais!inner(*)
    `
    )
    .eq('usuario_id', usuarioId); // CORRIGIDO

  if (period === 'week') {
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte('concluido_em', weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte('concluido_em', monthAgo);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Erro ao buscar dados de questões:', { error });
    return null;
  }

  return {
    total: data.length,
    averageScore:
      data.length > 0
        ? data.reduce(
            (acc: number, item: unknown) => acc + ((item as Record<string, unknown>).pontuacao as number),
            0
          ) / data.length
        : 0,
  };
}

/**
 * Busca dados de disciplinas do banco de dados.
 */
async function fetchDisciplinasData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from('estatisticas_usuario_disciplina') // Tabela corrigida
    .select('*')
    .eq('usuario_id', usuarioId); // CORRIGIDO

  if (error) {
    logger.error('Erro ao buscar dados de disciplinas:', { error });
    return null;
  }

  return data;
}

// Funções utilitárias para cache expostas
export const cacheUtils = {
  /**
   * Obtém dados de desempenho com cache
   */
  async getCachedPerformance(usuarioId: string, type: string, period?: string) {
    const key = generateCacheKey('performance', usuarioId, type, period);

    let data = await getCache(usuarioId, key);

    if (!data) {
      // Se não há cache, buscar dados e salvar
      data = await fetchPerformanceData(usuarioId, type, period);
      if (data) {
        await setCache(usuarioId, key, data, 15); // Cache por 15 minutos
      }
    }

    return data;
  },
  fetchPerformanceData,
  fetchSimuladosData,
  fetchQuestoesData,
  fetchDisciplinasData,
  generateCacheKey,
};



