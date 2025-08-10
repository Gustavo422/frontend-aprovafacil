import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEnhancedStats } from '@/src/features/guru/hooks/useEnhancedStats';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

const server = setupServer(
  http.get('/api/guru/v1/dashboard/enhanced-stats', () => {
    return HttpResponse.json({ success: true, data: {
      totalSimulados: 1,
      totalQuestoes: 10,
      totalStudyTime: 30,
      averageScore: 70,
      accuracyRate: 80,
      approvalProbability: 60,
      studyStreak: 3,
      weeklyProgress: { simulados: 1, questoes: 10, studyTime: 30, scoreImprovement: 2 },
      disciplinaStats: [],
      performanceHistory: [],
      goalProgress: { targetScore: 70, currentScore: 70, targetDate: '2025-12-31', daysRemaining: 30, onTrack: true },
      competitiveRanking: { position: 10, totalusuarios: 100, percentile: 90 },
    } });
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

describe('useEnhancedStats (frontend)', () => {
  it.skip('deve retornar dados de stats com sucesso', async () => {
    const { result } = renderHook(() => useEnhancedStats(), { wrapper });
    await waitFor(() => result.current.data !== undefined);
    expect(result.current.data?.averageScore).toBe(70);
  });
});


