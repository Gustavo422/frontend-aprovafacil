import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useListarSimulados } from '@/src/features/simulados/hooks/use-list';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
  http.get('/api/simulados', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    if (request.headers.get('if-none-match') === 'W/"list:nc:1:10:all:none:none:0"') {
      return new Response(null, { status: 304 });
    }
    return HttpResponse.json({ success: true, data: [
      { id: 's1', slug: 'a', titulo: 'A', descricao: null, numero_questoes: 10, tempo_minutos: 60, dificuldade: 'medio', criado_em: new Date().toISOString() },
    ], pagination: { page, limit: 10, total: 1, totalPages: 1 } }, {
      headers: { ETag: 'W/"list:nc:1:10:all:none:none:0"', 'Last-Modified': new Date().toUTCString() }
    });
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

describe('useListarSimulados (frontend)', () => {
  it('deve carregar lista e projetar campos usados na UI', async () => {
    const { result } = renderHook(() => useListarSimulados({ page: 1, limit: 10 }), { wrapper });
    await waitFor(() => (result.current.data ?? []).length > 0);
    const first = result.current.data?.[0];
    expect(first?.slug).toBe('a');
    expect(first?.numero_questoes).toBe(10);
  });
});


