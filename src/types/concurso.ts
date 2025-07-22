// Tipos para o sistema de concursos

export interface Concurso {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria_id: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  banca?: string;
  ano?: number;
  edital_url?: string;
  data_prova?: string;
  vagas?: number;
  salario?: number;
}

export interface ConcursoCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  parent_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export type ConcursoCategoriaSlug = 'policial' | 'militar' | 'civil' | 'outros';

export interface ConcursoComCategoria extends Concurso {
  categoria?: ConcursoCategoria;
  // categorias_concursos?: CategoriaConcurso;
}

export interface ConcursoContextType {
  concurso_id: string;
  categoria_id: string;
  pode_alterar_ate: string;
  criado_em: string;
  atualizado_em: string;
  categoria?: ConcursoCategoria;
  concurso?: Concurso;
  userPreference?: UserConcursoPreference;
  disciplinas?: CategoriaDisciplina[];
}

// Alias para compatibilidade
export type ConcursoContext = ConcursoContextType;

export interface ConcursoContextWithContent extends ConcursoContextType {
  content: ConteudoFiltradoResponse;
}

export interface CategoriaDisciplina {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CategoriaComDisciplinas extends ConcursoCategoria {
  disciplinas: CategoriaDisciplina[];
}

export interface UserConcursoPreference {
  concurso_id: string;
  categoria_id: string;
  pode_alterar_ate: string;
  criado_em: string;
  atualizado_em: string;
}

export interface UserPreferenceResponse {
  data: ConcursoContextType | null;
  message: string;
  canChange?: boolean;
  daysUntilChange?: number;
}

export interface ConteudoFiltradoResponse {
  data: {
    simulados: Record<string, unknown>[];
    flashcards: Record<string, unknown>[];
    apostilas: Record<string, unknown>[];
    mapaAssuntos: Record<string, unknown>[];
  };
  total: number;
  page: number;
  limit: number;
}

export interface ConteudoFilters {
  disciplina_id?: string;
  categoria_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserProgress {
  total_questoes: number;
  questoes_respondidas: number;
  acertos: number;
  erros: number;
  taxa_acerto: number;
  tempo_medio: number;
}

export interface ConcursoProgress {
  progresso_geral: UserProgress;
  progresso_disciplinas: Record<string, UserProgress>;
  ultima_atualizacao: string;
}

export interface ConcursoFilters {
  categoria_id?: string;
  ativo?: boolean;
  search?: string;
} 



