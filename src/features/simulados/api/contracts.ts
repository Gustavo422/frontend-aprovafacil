export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

// Tabela `simulados` conforme @schema_public.sql
export interface Simulado {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  concurso_id: string | null;
  categoria_id: string | null;
  numero_questoes: number;
  tempo_minutos: number;
  dificuldade: string;
  disciplinas: unknown | null; // jsonb
  publico: boolean;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string; // timestamptz
  atualizado_em: string; // timestamptz
  // Derivado do progresso do usuário (quando disponível na listagem)
  status?: 'finalizado' | 'em_andamento' | 'nao_iniciado';
}

// Subtipos projetados para UI
export type SimuladoListItem = Pick<Simulado,
  'id' | 'slug' | 'titulo' | 'descricao' | 'numero_questoes' | 'tempo_minutos' | 'dificuldade' | 'criado_em'>;

export type SimuladoDetail = Pick<Simulado,
  'id' | 'slug' | 'titulo' | 'descricao' | 'numero_questoes' | 'tempo_minutos'>;

// Tabela `questoes_simulado` conforme @schema_public.sql
export interface QuestaoSimulado {
  id: string;
  simulado_id: string;
  numero_questao: number;
  enunciado: string;
  alternativas: Record<string, string>;
  resposta_correta: string;
  explicacao?: string | null;
  disciplina?: string | null;
  assunto?: string | null;
  dificuldade?: string | null;
  peso_disciplina?: number | null;
  ordem?: number | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type QuestaoDisplay = Pick<QuestaoSimulado,
  'id' | 'numero_questao' | 'enunciado' | 'alternativas' | 'resposta_correta' | 'explicacao' | 'disciplina' | 'dificuldade'>;

// Tabela `progresso_usuario_simulado` conforme @schema_public.sql
export interface ProgressoUsuarioSimulado {
  id: string;
  usuario_id: string;
  simulado_id: string;
  pontuacao: number;
  tempo_gasto_minutos: number;
  respostas: Record<string, unknown>;
  concluido_em: string | null;
  is_concluido: boolean;
}

export type ListarSimuladosQuery = {
  concurso_id?: string;
  page?: number;
  limit?: number;
  dificuldade?: string;
  search?: string;
  publico?: boolean;
  status?: 'finalizado' | 'em_andamento' | 'nao_iniciado';
};

export type PaginatedSimulados = {
  items: Simulado[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Input para criação de simulado (alinhado ao schema @schema_public.sql)
export type CreateSimuladoInput = {
  titulo: string;
  slug: string;
  descricao?: string | null;
  concurso_id?: string | null;
  categoria_id?: string | null;
  numero_questoes?: number;
  tempo_minutos?: number;
  dificuldade?: 'facil' | 'medio' | 'dificil';
  disciplinas?: unknown | null;
  publico?: boolean;
  ativo?: boolean;
};


