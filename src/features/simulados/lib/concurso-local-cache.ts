/*
 * ConcursoLocalCache v2
 * - Chaves:
 *   - Index por concurso: `simulados_index:<concurso_id>`
 *   - Por simulado: `simulado:<concurso_id>:<slug>` com seções `meta` e `questoes`
 * - TTL padrão: 30 minutos
 * - Seguro para SSR: todos acessos a localStorage são protegidos
 */

import { getETag, setETag, getLastModified, setLastModified } from './etag';
import { getCachedJson, setCachedJson } from './local-cache';
import type { QuestaoSimulado, Simulado, SimuladoListItem } from '../api/contracts';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// TTLs por seção (amigáveis):
export const INDEX_TTL_MS = 15 * 60 * 1000; // 15 min
export const META_TTL_MS = 60 * 60 * 1000; // 60 min
export const QUESTOES_TTL_MS = 30 * 60 * 1000; // 30 min

// Keys helpers
const indexKey = (concursoId: string | null | undefined) => `simulados_index:${concursoId ?? ''}`;
const simKey = (concursoId: string | null | undefined, slug: string) => `simulado:${concursoId ?? ''}:${slug}`;
const etagIndexKey = (concursoId: string | null | undefined) => `simulados_index:${concursoId ?? ''}`;
const etagMetaKey = (concursoId: string | null | undefined, slug: string) => `simulado_meta:${concursoId ?? ''}:${slug}`;
const etagQuestoesKey = (concursoId: string | null | undefined, slug: string) => `simulado_questoes:${concursoId ?? ''}:${slug}`;

export type SimuladosIndexCache = {
  items: SimuladoListItem[];
  updatedAtMs: number;
};

export type SimuladoCacheEntry = {
  meta?: {
    data: Pick<Simulado, 'id' | 'slug' | 'titulo' | 'descricao' | 'numero_questoes' | 'tempo_minutos' | 'concurso_id'>;
    updatedAtMs: number;
  };
  questoes?: {
    data: Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>[];
    updatedAtMs: number;
  };
};

export function isExpired(updatedAtMs: number | null | undefined, ttlMs: number = INDEX_TTL_MS): boolean {
  if (!updatedAtMs) return true;
  return Date.now() - updatedAtMs > ttlMs;
}

// Index cache
export function getSimuladosIndex(concursoId?: string | null): { data: SimuladosIndexCache | null; isStale: boolean } {
  const { data, updatedAtMs } = getCachedJson<SimuladosIndexCache>(indexKey(concursoId));
  const isStale = isExpired(updatedAtMs ?? undefined, INDEX_TTL_MS);
  return { data: data ?? null, isStale };
}

export function setSimuladosIndex(
  concursoId: string | null | undefined,
  items: SimuladoListItem[],
  etag?: string | null,
  lastModified?: string | null
): void {
  const payload: SimuladosIndexCache = {
    items,
    updatedAtMs: lastModified ? Date.parse(lastModified) : Date.now(),
  };
  setCachedJson(indexKey(concursoId), payload, payload.updatedAtMs);
  if (etag) setETag(etagIndexKey(concursoId), etag);
  if (lastModified) setLastModified(etagIndexKey(concursoId), lastModified);
}

export function getIndexETags(concursoId?: string | null): { etag: string | null; lastModified: string | null } {
  return { etag: getETag(etagIndexKey(concursoId)), lastModified: getLastModified(etagIndexKey(concursoId)) };
}

// Simulado cache (meta/questoes)
export function getSimuladoCache(
  concursoId: string | null | undefined,
  slug: string
): { data: SimuladoCacheEntry | null; isStaleMeta: boolean; isStaleQuestoes: boolean } {
  const { data, updatedAtMs } = getCachedJson<SimuladoCacheEntry>(simKey(concursoId, slug));
  const entry = data ?? null;
  const metaUpdatedAt = entry?.meta?.updatedAtMs ?? updatedAtMs ?? null;
  const questoesUpdatedAt = entry?.questoes?.updatedAtMs ?? updatedAtMs ?? null;
  return {
    data: entry,
    isStaleMeta: isExpired(metaUpdatedAt ?? undefined, META_TTL_MS),
    isStaleQuestoes: isExpired(questoesUpdatedAt ?? undefined, QUESTOES_TTL_MS),
  };
}

export function upsertSimuladoMeta(
  concursoId: string | null | undefined,
  slug: string,
  meta: Pick<Simulado, 'id' | 'slug' | 'titulo' | 'descricao' | 'numero_questoes' | 'tempo_minutos' | 'concurso_id'>,
  etag?: string | null,
  lastModified?: string | null
): void {
  const { data } = getCachedJson<SimuladoCacheEntry>(simKey(concursoId, slug));
  const entry: SimuladoCacheEntry = data ?? {};
  const updatedAtMs = lastModified ? Date.parse(lastModified) : Date.now();
  entry.meta = { data: meta, updatedAtMs };
  setCachedJson(simKey(concursoId, slug), entry, updatedAtMs);
  if (etag) setETag(etagMetaKey(concursoId, slug), etag);
  if (lastModified) setLastModified(etagMetaKey(concursoId, slug), lastModified);
}

export function upsertSimuladoQuestoes(
  concursoId: string | null | undefined,
  slug: string,
  questoes: Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>[],
  etag?: string | null,
  lastModified?: string | null
): void {
  const { data } = getCachedJson<SimuladoCacheEntry>(simKey(concursoId, slug));
  const entry: SimuladoCacheEntry = data ?? {};
  const updatedAtMs = lastModified ? Date.parse(lastModified) : Date.now();
  entry.questoes = { data: questoes, updatedAtMs };
  setCachedJson(simKey(concursoId, slug), entry, updatedAtMs);
  if (etag) setETag(etagQuestoesKey(concursoId, slug), etag);
  if (lastModified) setLastModified(etagQuestoesKey(concursoId, slug), lastModified);
}

export function getSimuladoETags(
  concursoId: string | null | undefined,
  slug: string
): { meta: { etag: string | null; lastModified: string | null }; questoes: { etag: string | null; lastModified: string | null } } {
  return {
    meta: { etag: getETag(etagMetaKey(concursoId, slug)), lastModified: getLastModified(etagMetaKey(concursoId, slug)) },
    questoes: { etag: getETag(etagQuestoesKey(concursoId, slug)), lastModified: getLastModified(etagQuestoesKey(concursoId, slug)) },
  };
}

// Utilitário de mesclagem (patch) para lista de questões por id
export function mergeQuestoesById(
  current: Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>[],
  patch: Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>[],
  removedIds: string[] = []
): Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>[] {
  const idToItem = new Map<string, Pick<QuestaoSimulado, 'id' | 'numero_questao' | 'atualizado_em'>>();
  current.forEach((q) => idToItem.set(q.id, q));
  patch.forEach((q) => idToItem.set(q.id, q));
  removedIds.forEach((id) => idToItem.delete(id));
  return Array.from(idToItem.values()).sort((a, b) => (a.numero_questao ?? 0) - (b.numero_questao ?? 0));
}


