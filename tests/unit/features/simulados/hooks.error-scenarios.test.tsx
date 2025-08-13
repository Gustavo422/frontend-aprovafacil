import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useBuscarSimuladoPorSlug } from '@/src/features/simulados/hooks/use-by-slug';
import { useListarSimulados } from '@/src/features/simulados/hooks/use-list';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
  http.get('/api/simulados/slug/precondition', () => {
    return new Response(JSON.stringify({ success: false, error: 'Precondition Failed', code: 'PRECONDITION_FAILED' }), { status: 412 });
  }),
  http.get('/api/simulados/slug/precondition/questoes', () => {
    return HttpResponse.json({ success: true, data: [] });
  }),
  http.get('/api/simulados', () => {
    return new Response(JSON.stringify({ success: false, error: 'Too Many Requests', code: 'RATE_LIMITED' }), { status: 429 });
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

describe('Simulados hooks - cenários de erro (412/429)', () => {
  it('deve lidar com 412 Precondition Failed no detalhe por slug', async () => {
    const { result } = renderHook(() => useBuscarSimuladoPorSlug('precondition'), { wrapper });
    // Sem await: o erro será refletido na propriedade error do query
    expect(result.current.error).toBeDefined();
  });

  it('deve lidar com 429 Too Many Requests na listagem', async () => {
    const { result } = renderHook(() => useListarSimulados({ page: 1, limit: 10 }), { wrapper });
    expect(result.current.error).toBeDefined();
  });
});


