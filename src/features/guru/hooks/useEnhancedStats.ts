import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import type { EnhancedStatsDTO } from '../api/contracts';

export function useEnhancedStats() {
  return useConcursoQuery<EnhancedStatsDTO>({
    endpoint: '/api/guru/v1/dashboard/enhanced-stats',
    requireConcurso: true,
    staleTime: 5 * 60 * 1000,
  });
}


