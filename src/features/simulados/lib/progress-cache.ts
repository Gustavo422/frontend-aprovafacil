import type { ProgressoUsuarioSimulado } from '../api/contracts';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function makeKey(usuarioId: string, simuladoId: string): string {
  return `simulado_progress:${usuarioId}:${simuladoId}`;
}

function tsKey(usuarioId: string, simuladoId: string): string {
  return `simulado_progress:ts:${usuarioId}:${simuladoId}`;
}

export function getProgressFromCache(
  usuarioId: string,
  simuladoId: string
): { data: ProgressoUsuarioSimulado | null; updatedAtMs: number | null } {
  if (!isBrowser()) return { data: null, updatedAtMs: null };
  try {
    const raw = localStorage.getItem(makeKey(usuarioId, simuladoId));
    const ts = localStorage.getItem(tsKey(usuarioId, simuladoId));
    if (!raw) return { data: null, updatedAtMs: ts ? Number(ts) : null };
    const parsed = JSON.parse(raw) as ProgressoUsuarioSimulado;
    return { data: parsed, updatedAtMs: ts ? Number(ts) : null };
  } catch {
    return { data: null, updatedAtMs: null };
  }
}

export function setProgressToCache(progress: ProgressoUsuarioSimulado | null | undefined): void {
  if (!isBrowser() || !progress) return;
  try {
    const key = makeKey(progress.usuario_id, progress.simulado_id);
    localStorage.setItem(key, JSON.stringify(progress));
    localStorage.setItem(tsKey(progress.usuario_id, progress.simulado_id), String(Date.now()));
  } catch {
    // ignore
  }
}


