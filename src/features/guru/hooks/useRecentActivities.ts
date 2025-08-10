import { useConcursoQueryWithParams } from '@/src/hooks/useConcursoQuery';
import type { ActivityDTO } from '../api/contracts';

interface UseRecentActivitiesOptions {
  limit?: number;
}

export function useRecentActivities(options: UseRecentActivitiesOptions = {}) {
  const { limit = 10 } = options;
  return useConcursoQueryWithParams<ActivityDTO[]>(
    '/api/guru/v1/dashboard/activities',
    { limit },
    {
      requireConcurso: true,
      fallbackData: [],
      staleTime: 2 * 60 * 1000,
    },
  );
}


