import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecentActivities } from '@/src/features/guru/hooks/useRecentActivities';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
  http.get('/api/guru/v1/dashboard/activities', () => {
    return HttpResponse.json({ success: true, data: [
      { id: 'a1', type: 'simulado', titulo: 'S1', descricao: '50 questões', time: '30min', created_at: new Date().toISOString(), score: 72 },
    ] });
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

describe('useRecentActivities (frontend)', () => {
  it.skip('deve retornar lista de atividades', async () => {
    const { result } = renderHook(() => useRecentActivities({ limit: 5 }), { wrapper });
    await waitFor(() => Array.isArray(result.current.data));
    expect((result.current.data ?? []).length).toBeGreaterThanOrEqual(1);
  });
});


