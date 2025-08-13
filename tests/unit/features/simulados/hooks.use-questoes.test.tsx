import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuestoesDoSimulado } from '@/src/features/simulados/hooks/use-questoes';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
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

describe('useQuestoesDoSimulado (frontend)', () => {
  it('deve carregar questões do simulado por slug', async () => {
    const { result } = renderHook(() => useQuestoesDoSimulado('a'), { wrapper });
    await waitFor(() => (result.current.data ?? []).length > 0);
    expect(result.current.data?.[0]?.numero_questao).toBe(1);
  });
});


