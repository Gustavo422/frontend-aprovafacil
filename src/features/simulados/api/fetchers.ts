import type { ListarSimuladosQuery, ProgressoUsuarioSimulado, QuestaoSimulado, Simulado, SimuladoListItem, CreateSimuladoInput, PaginatedSimulados } from '../api/contracts';
import { getProgressFromCache, setProgressToCache } from '../lib/progress-cache';
import { getETag, setETag, getLastModified, setLastModified } from '../lib/etag';
import { getCachedJson, setCachedJson } from '../lib/local-cache';
import {
  getIndexETags,
  getSimuladosIndex,
  setSimuladosIndex,
  getSimuladoCache,
  getSimuladoETags,
  upsertSimuladoMeta,
  upsertSimuladoQuestoes,
  isExpired,
  INDEX_TTL_MS,
  META_TTL_MS,
  QUESTOES_TTL_MS,
} from '../lib/concurso-local-cache';
import { recordCacheHit, recordCacheFallback, recordNetwork200, recordNetwork304 } from '../lib/metrics';

/**
 * Funções de busca (queryFns) reutilizáveis para os hooks e prefetch.
 * Implementam ETag/Last-Modified e cache local para reduzir TTFB.
 */

export async function listSimulados(
  activeConcursoId?: string | null,
  filters: Omit<ListarSimuladosQuery, 'concurso_id'> = {}
): Promise<PaginatedSimulados> {
  const params = new URLSearchParams();
  if (activeConcursoId) params.append('concurso_id', activeConcursoId);
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v));
  });
  const qs = params.toString();
  const resourceKey = `list:${activeConcursoId ?? ''}:${qs}`;
  // TTL gating: retornar cache se ainda válido
  const cachedBeforeFetch = getCachedJson<PaginatedSimulados>(resourceKey);
  if (cachedBeforeFetch.data && !isExpired(cachedBeforeFetch.updatedAtMs ?? undefined, INDEX_TTL_MS)) {
    recordCacheHit('list');
    return cachedBeforeFetch.data;
  }
  const { etag, lastModified } = getIndexETags(activeConcursoId);
  try {
    const res = await fetch(`/api/simulados${qs ? `?${qs}` : ''}`, {
      headers: {
        ...(etag ? { 'If-None-Match': etag } : {}),
        ...(lastModified ? { 'If-Modified-Since': lastModified } : {}),
      },
    });
    if (res.status === 304) {
      recordNetwork304('list');
      const cachedFull = getCachedJson<PaginatedSimulados>(resourceKey);
      if (cachedFull.data) return cachedFull.data;
      const { data: idx } = getSimuladosIndex(activeConcursoId);
      if (idx?.items) {
        // Mapear índice mínimo para Simulado parcial (campos usados na UI)
        const mapped = idx.items.map((i) => ({
          id: (i as any).id,
          slug: i.slug,
          titulo: i.titulo,
          descricao: (i as any).descricao ?? null,
          numero_questoes: i.numero_questoes,
          tempo_minutos: i.tempo_minutos,
          dificuldade: i.dificuldade,
          criado_em: (i as any).atualizado_em ?? new Date(idx.updatedAtMs).toISOString(),
        })) as unknown as Simulado[];
        return { items: mapped };
      }
      recordCacheFallback('list');
      return { items: [] };
    }
    if (!res.ok) throw new Error('Falha ao listar simulados');
    recordNetwork200('list');

    const receivedEtag = res.headers.get('ETag');
    const receivedLastMod = res.headers.get('Last-Modified');

    const body = await res.json();
    const items = (body?.data ?? body?.items ?? body) as Simulado[];
    const pagination = body?.pagination as PaginatedSimulados['pagination'];

    // Persistência: índice resumido + cache completo
    const listItems: SimuladoListItem[] = (items ?? []).map((s) => ({
      id: s.id,
      slug: s.slug,
      titulo: s.titulo,
      descricao: s.descricao,
      numero_questoes: s.numero_questoes,
      tempo_minutos: s.tempo_minutos,
      dificuldade: s.dificuldade,
      criado_em: s.criado_em,
    }));
    if (receivedEtag || receivedLastMod) setSimuladosIndex(activeConcursoId ?? null, listItems as any, receivedEtag, receivedLastMod);

    const updatedAtMs = receivedLastMod ? Date.parse(receivedLastMod) : Date.now();
    if (receivedEtag) setETag(resourceKey, receivedEtag);
    if (receivedLastMod) setLastModified(resourceKey, receivedLastMod);
    setCachedJson(resourceKey, { items, pagination }, updatedAtMs);
    return { items, pagination };
  } catch (err) {
    // Fallback offline: cache completo; senão, índice
    const cachedFull = getCachedJson<PaginatedSimulados>(resourceKey);
    if (cachedFull.data) return cachedFull.data;
    const { data: idx } = getSimuladosIndex(activeConcursoId);
    if (idx?.items) {
      const mapped = idx.items.map((i) => ({
        id: (i as any).id,
        slug: i.slug,
        titulo: i.titulo,
        descricao: (i as any).descricao ?? null,
        numero_questoes: i.numero_questoes,
        tempo_minutos: i.tempo_minutos,
        dificuldade: i.dificuldade,
        criado_em: (i as any).atualizado_em ?? new Date(idx.updatedAtMs).toISOString(),
      })) as unknown as Simulado[];
      return { items: mapped };
    }
    recordCacheFallback('list');
    throw err;
  }
}

export async function getSimuladoBySlug(slug: string, activeConcursoId?: string | null): Promise<Simulado | undefined> {
  const resourceKey = `detail:${activeConcursoId ?? ''}:${slug}`;
  const sectionETags = getSimuladoETags(activeConcursoId ?? null, slug);
  // TTL gating via cache v2
  const { data: cacheEntry, isStaleMeta } = getSimuladoCache(activeConcursoId ?? null, slug);
  if (cacheEntry?.meta?.data && !isStaleMeta) {
    recordCacheHit('detail');
    return cacheEntry.meta.data as unknown as Simulado;
  }
  const etag = sectionETags.meta.etag ?? getETag(resourceKey);
  const lastMod = sectionETags.meta.lastModified ?? getLastModified(resourceKey);
  try {
    const res = await fetch(`/api/simulados/slug/${slug}`, {
      headers: {
        ...(etag ? { 'If-None-Match': etag } : {}),
        ...(lastMod ? { 'If-Modified-Since': lastMod } : {}),
      },
    });
    if (res.status === 304) {
      recordNetwork304('detail');
      const { data: cacheEntry } = getSimuladoCache(activeConcursoId ?? null, slug);
      if (cacheEntry?.meta?.data) return cacheEntry.meta.data as unknown as Simulado;
      const cached = getCachedJson<Simulado>(resourceKey);
      if (cached.data) recordCacheHit('detail');
      return cached.data ?? undefined;
    }
    if (!res.ok) throw new Error('Falha ao buscar simulado');
    recordNetwork200('detail');

    const receivedEtag = res.headers.get('ETag');
    const receivedLastMod = res.headers.get('Last-Modified');

    const body = await res.json();
    const data = (body?.data ?? body) as Simulado;

    // Upsert seção meta no cache v2
    upsertSimuladoMeta(activeConcursoId ?? null, slug, {
      id: data.id,
      slug: data.slug,
      titulo: data.titulo,
      descricao: data.descricao,
      numero_questoes: data.numero_questoes,
      tempo_minutos: data.tempo_minutos,
      concurso_id: data.concurso_id,
    }, receivedEtag ?? undefined, receivedLastMod ?? undefined);

    const updatedAtMs = receivedLastMod ? Date.parse(receivedLastMod) : Date.now();
    if (receivedEtag) setETag(resourceKey, receivedEtag);
    if (receivedLastMod) setLastModified(resourceKey, receivedLastMod);
    setCachedJson(resourceKey, data, updatedAtMs);
    return data;
  } catch (err) {
    // Fallback offline
    const { data: cacheEntry } = getSimuladoCache(activeConcursoId ?? null, slug);
    if (cacheEntry?.meta?.data) return cacheEntry.meta.data as unknown as Simulado;
    const cached = getCachedJson<Simulado>(resourceKey);
    if (cached.data) return cached.data;
    recordCacheFallback('detail');
    throw err;
  }
}

export async function getQuestoesBySlug(slug: string, activeConcursoId?: string | null): Promise<QuestaoSimulado[]> {
  const resourceKey = `questoes:${activeConcursoId ?? ''}:${slug}`;
  const sectionETags = getSimuladoETags(activeConcursoId ?? null, slug);
  const etag = sectionETags.questoes.etag ?? getETag(resourceKey);
  const lastMod = sectionETags.questoes.lastModified ?? getLastModified(resourceKey);
  // TTL gating via cache v2
  const { data: cacheEntry, isStaleQuestoes } = getSimuladoCache(activeConcursoId ?? null, slug);
  if (cacheEntry?.questoes?.data && !isStaleQuestoes) {
    // Só usamos o cache quando temos o payload COMPLETO persistido
    const cachedFull = getCachedJson<QuestaoSimulado[]>(resourceKey);
    if (cachedFull.data) {
      recordCacheHit('questoes');
      return cachedFull.data;
    }
    // Sem cache completo, seguir para busca de rede
  }
  try {
    const url = typeof window === 'undefined'
      ? `/api/simulados/slug/${slug}/questoes`
      : new URL(`/api/simulados/slug/${slug}/questoes`, window.location.origin).toString();
    // Cursor opcional: poderia ser ajustado por chamada (futuro)
    const res = await fetch(url, {
      headers: {
        ...(etag ? { 'If-None-Match': etag } : {}),
        ...(lastMod ? { 'If-Modified-Since': lastMod } : {}),
      },
    });
    if (res.status === 304) {
      recordNetwork304('questoes');
      const cached = getCachedJson<QuestaoSimulado[]>(resourceKey);
      if (cached.data) {
        recordCacheHit('questoes');
        return cached.data;
      }
      return [];
    }
    if (!res.ok) throw new Error('Falha ao buscar questões');
    recordNetwork200('questoes');

    const receivedEtag = res.headers.get('ETag');
    const receivedLastMod = res.headers.get('Last-Modified');

    const body = await res.json();
    const data = (body?.data ?? body) as QuestaoSimulado[];

    // Upsert seção questoes no cache v2 (forma resumida)
    upsertSimuladoQuestoes(
      activeConcursoId ?? null,
      slug,
      (data ?? []).map((q) => ({ id: q.id, numero_questao: q.numero_questao, atualizado_em: q.atualizado_em })),
      receivedEtag ?? undefined,
      receivedLastMod ?? undefined,
    );

    const updatedAtMs = receivedLastMod ? Date.parse(receivedLastMod) : Date.now();
    if (receivedEtag) setETag(resourceKey, receivedEtag);
    if (receivedLastMod) setLastModified(resourceKey, receivedLastMod);
    setCachedJson(resourceKey, data, updatedAtMs);
    return data;
  } catch (err) {
    // Fallback offline
    const cached = getCachedJson<QuestaoSimulado[]>(resourceKey);
    if (cached.data) return cached.data;
    recordCacheFallback('questoes');
    throw err;
  }
}

export async function getProgressoBySlug(slug: string): Promise<ProgressoUsuarioSimulado | null> {
  const resourceKey = `progresso:${slug}`;
  const etag = getETag(resourceKey);
  const lastMod = getLastModified(resourceKey);
  const res = await fetch(`/api/simulados/slug/${slug}/progresso`, {
    headers: {
      ...(etag ? { 'If-None-Match': etag } : {}),
      ...(lastMod ? { 'If-Modified-Since': lastMod } : {}),
    },
  });
  if (res.status === 304) {
    const cached = getCachedJson<ProgressoUsuarioSimulado | null>(resourceKey);
    return cached.data ?? null;
  }
  if (!res.ok && res.status !== 404) throw new Error('Falha ao carregar progresso');
  if (res.status === 404) return null;

  const receivedEtag = res.headers.get('ETag');
  const receivedLastMod = res.headers.get('Last-Modified');
  if (receivedEtag) setETag(resourceKey, receivedEtag);
  if (receivedLastMod) setLastModified(resourceKey, receivedLastMod);

  const body = await res.json();
  const data = (body?.data ?? body) as ProgressoUsuarioSimulado | null;
  const updatedAtMs = receivedLastMod ? Date.parse(receivedLastMod) : Date.now();
  setCachedJson(resourceKey, data, updatedAtMs);
  if (data?.usuario_id && data?.simulado_id) {
    setProgressToCache(data);
  }
  return data;
}

export async function createSimulado(input: CreateSimuladoInput): Promise<Simulado> {
  const res = await fetch(`/api/simulados/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = 'Erro ao criar simulado';
    try { const err = await res.json(); message = err?.error || message; } catch {}
    throw new Error(message);
  }
  const body = await res.json();
  return (body?.data ?? body) as Simulado;
}