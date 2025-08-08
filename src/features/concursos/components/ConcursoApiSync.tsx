'use client';

import { useConcursoApiSync } from '../hooks/use-concurso-api-sync';

/**
 * Componente wrapper que sincroniza o concurso ativo entre o ConcursoContext e o apiClient
 * Deve ser usado dentro de um ConcursoProvider
 */
export function ConcursoApiSync() {
  useConcursoApiSync();
  return null;
}
