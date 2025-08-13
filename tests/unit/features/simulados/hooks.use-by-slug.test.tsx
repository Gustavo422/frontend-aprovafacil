import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useBuscarSimuladoPorSlug } from '@/src/features/simulados/hooks/use-by-slug';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
  http.get('/api/simulados/slug/a', () => {
    return HttpResponse.json({ success: true, data: {
      id: 's1', slug: 'a', titulo: 'A', descricao: null, numero_questoes: 10, tempo_minutos: 60,
    } }, { headers: { ETag: 'W/"m:1|q:1"', 'Last-Modified': new Date().toUTCString() } });
  }),
  http.get('/api/simulados/slug/a/questoes', () => {
    return HttpResponse.json({ success: true, data: [
      { id: 'q1', numero_questao: 1, enunciado: 'E1', alternativas: { a: 'A' }, resposta_correta: 'a', atualizado_em: new Date().toISOString(), ativo: true },
    ] }, { headers: { ETag: 'W/"q:1"', 'Last-Modified': new Date().toUTCString() } });
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return (
    <ConcursoProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ConcursoProvider>
  );
}

describe('useBuscarSimuladoPorSlug (frontend)', () => {
  it('deve carregar meta e questoes por slug', async () => {
    const { result } = renderHook(() => useBuscarSimuladoPorSlug('a'), { wrapper });
    await waitFor(() => !!result.current.simulado);
    expect(result.current.simulado?.slug).toBe('a');
    expect((result.current.questoes ?? []).length).toBe(1);
  });
});


