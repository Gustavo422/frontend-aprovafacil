// Hooks principais
export { useWeeklyQuestions } from './use-weekly-questions';

// Hooks individuais para uso específico
export { 
  useConcluirSemana,
  useRoadmap,
  useHistorico,
  useSemanaAtual
} from './use-weekly-questions';

// Tipos
export type {
  QuestaoSemanal,
  Questao,
  SemanaAtual,
  ProgressoSemana,
  RoadmapItem,
  HistoricoResponse,
  ConcluirSemanaInput,
  ConcluirSemanaResponse,
} from './use-weekly-questions';
