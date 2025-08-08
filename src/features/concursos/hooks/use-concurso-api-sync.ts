'use client';

import { useEffect } from 'react';
import { useConcurso } from '@/contexts/ConcursoContext';
import { setActiveConcurso } from '@/lib/api';

/**
 * Hook que sincroniza o concurso ativo entre o ConcursoContext e o apiClient
 * Deve ser usado no componente raiz da aplicação
 */
export function useConcursoApiSync() {
  const { activeConcursoId } = useConcurso();

  useEffect(() => {
    // Sincroniza o concurso ativo com o apiClient sempre que mudar
    setActiveConcurso(activeConcursoId || null);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] 🔄 Sincronizando concurso ativo com apiClient:', activeConcursoId);
    }
  }, [activeConcursoId]);

  return null;
}
