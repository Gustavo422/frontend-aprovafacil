import { describe, it, expect } from 'vitest';
import {
  getSimuladosIndex,
  setSimuladosIndex,
  getSimuladoCache,
  upsertSimuladoMeta,
  upsertSimuladoQuestoes,
  isExpired,
} from '@/src/features/simulados/lib/concurso-local-cache';

describe('ConcursoLocalCache v2', () => {
  it('should set and read simulados index', () => {
    setSimuladosIndex('c1', [
      { id: 's1', slug: 'a', titulo: 'A', descricao: null, numero_questoes: 1, tempo_minutos: 60, dificuldade: 'medio', criado_em: new Date().toISOString() } as any,
    ], 'W/"t1"', new Date().toUTCString());
    const { data } = getSimuladosIndex('c1');
    expect(data?.items?.length).toBe(1);
  });

  it('should upsert meta and questoes for a simulado', () => {
    upsertSimuladoMeta('c2', 'slug', {
      id: 's2', slug: 'slug', titulo: 'S', descricao: null, numero_questoes: 2, tempo_minutos: 30, concurso_id: 'c2'
    });
    upsertSimuladoQuestoes('c2', 'slug', [{ id: 'q1', numero_questao: 1, atualizado_em: new Date().toISOString() }]);
    const { data } = getSimuladoCache('c2', 'slug');
    expect(data?.meta?.data?.id).toBe('s2');
    expect(data?.questoes?.data?.length).toBe(1);
  });

  it('isExpired should return true for old timestamps', () => {
    const old = Date.now() - (31 * 60 * 1000);
    expect(isExpired(old)).toBe(true);
  });
});


