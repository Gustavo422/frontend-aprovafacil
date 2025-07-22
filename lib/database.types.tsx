export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type User = {
  id: string;
  nome: string;
  email: string;
  ultimo_login?: Date;
  criado_em: string;
  atualizado_em: string;
  tempo_estudo_minutos: number;
  total_questoes_respondidas: number;
  total_resposta_corretas: number;
  pontuacao_media: number;
}

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      categorias_concursos: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          descricao: string | null;
          cor_primaria: string;
          cor_secundaria: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          descricao?: string | null;
          cor_primaria?: string;
          cor_secundaria?: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          descricao?: string | null;
          cor_primaria?: string;
          cor_secundaria?: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      disciplinas_categoria: {
        Row: {
          id: string;
          categoria_id: string;
          nome: string;
          peso: number;
          horas_semanais: number;
          ordem: number;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          categoria_id: string;
          nome: string;
          peso: number;
          horas_semanais: number;
          ordem: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string;
          nome?: string;
          peso?: number;
          horas_semanais?: number;
          ordem?: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      preferencias_usuario_concurso: {
        Row: {
          id: string;
          user_id: string;
          concurso_id: string;
          selecionado_em: string;
          pode_alterar_ate: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concurso_id: string;
          selecionado_em?: string;
          pode_alterar_ate: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          concurso_id?: string;
          selecionado_em?: string;
          pode_alterar_ate?: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      concursos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          ano: number | null;
          banca: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
          categoria_id: string | null;
          edital_url: string | null;
          data_prova: string | null;
          vagas: number | null;
          salario: number | null;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          ano?: number | null;
          banca?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
          categoria_id?: string | null;
          edital_url?: string | null;
          data_prova?: string | null;
          vagas?: number | null;
          salario?: number | null;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;

          ano?: number | null;
          banca?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
          categoria_id?: string | null;
          edital_url?: string | null;
          data_prova?: string | null;
          vagas?: number | null;
          salario?: number | null;
        };
      };
      simulados: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          questions_count: number;
          time_minutes: number;
          dificuldade: string;
          criado_em: string;
          concurso_id: string | null;
          is_public: boolean;
          atualizado_em: string;
          deleted_at: string | null;
          created_by: string | null;
          categoria_id: string | null;
          disciplinas: Json | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          questions_count: number;
          time_minutes: number;
          dificuldade: string;
          criado_em?: string;
          concurso_id?: string | null;
          is_public?: boolean;
          atualizado_em?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          questions_count?: number;
          time_minutes?: number;
          dificuldade?: string;
          criado_em?: string;
          concurso_id?: string | null;
          is_public?: boolean;
          atualizado_em?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
      };
      questoes_simulado: {
        Row: {
          id: string;
          simulado_id: string;
          question_number: number;
          enunciado: string;
          alternativas: Json;
          resposta_correta: string;
          explicacao: string | null;

          tema: string | null;
          dificuldade: string | null;
          criado_em: string;
          atualizado_em: string;
          deleted_at: string | null;
          concurso_id: string | null;
          categoria_id: string | null;
          disciplina: string | null;
          peso_disciplina: number | null;
        };
        Insert: {
          id?: string;
          simulado_id: string;
          question_number: number;
          enunciado: string;
          alternativas: Json;
          resposta_correta: string;
          explicacao?: string | null;
          tema?: string | null;
          dificuldade?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deleted_at?: string | null;
          concurso_id?: string | null;
          categoria_id?: string | null;
          disciplina?: string | null;
          peso_disciplina?: number | null;
        };
        Update: {
          id?: string;
          simulado_id?: string;
          question_number?: number;
          enunciado?: string;
          alternativas?: Json;
          resposta_correta?: string;
          explicacao?: string | null;
          tema?: string | null;
          dificuldade?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          deleted_at?: string | null;
          concurso_id?: string | null;
          categoria_id?: string | null;
          disciplina?: string | null;
          peso_disciplina?: number | null;
        };
      };
      progresso_usuario_simulado: {
        Row: {
          id: string;
          user_id: string;
          simulado_id: string;
          score: number;
          concluido_at: string;
          time_taken_minutes: number;
          answers: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          simulado_id: string;
          score: number;
          concluido_at?: string;
          time_taken_minutes: number;
          answers: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          simulado_id?: string;
          score?: number;
          concluido_at?: string;
          time_taken_minutes?: number;
          answers?: Json;
        };
      };
      questoes_semanais: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          week_number: number;
          year: number;
          criado_em: string;
          concurso_id: string | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          week_number: number;
          year: number;
          criado_em?: string;
          concurso_id?: string | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          week_number?: number;
          year?: number;
          criado_em?: string;
          concurso_id?: string | null;
        };
      };
      progresso_usuario_questoes_semanais: {
        Row: {
          id: string;
          user_id: string;
          questoes_semanais_id: string;
          score: number;
          concluido_at: string;
          answers: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          questoes_semanais_id: string;
          score: number;
          concluido_at?: string;
          answers: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          questoes_semanais_id?: string;
          score?: number;
          concluido_at?: string;
          answers?: Json;
        };
      };
      mapa_assuntos: {
        Row: {
          id: string;
          disciplina: string;
          tema: string;
          subtema: string | null;
          concurso_id: string | null;
          criado_em: string;
          categoria_id: string | null;
          peso_disciplina: number | null;
        };
        Insert: {
          id?: string;
          disciplina: string;
          tema: string;
          subtema?: string | null;
          concurso_id?: string | null;
          criado_em?: string;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
        Update: {
          id?: string;
          disciplina?: string;
          tema?: string;
          subtema?: string | null;
          concurso_id?: string | null;
          criado_em?: string;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
      };
      progresso_usuario_mapa_assuntos: {
        Row: {
          id: string;
          user_id: string;
          mapa_assunto_id: string;
          status: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mapa_assunto_id: string;
          status: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mapa_assunto_id?: string;
          status?: string;
          atualizado_em?: string;
        };
      };
      planos_estudo: {
        Row: {
          id: string;
          user_id: string;
          concurso_id: string | null;
          start_date: string;
          end_date: string;
          criado_em: string;
          schedule: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          concurso_id?: string | null;
          start_date: string;
          end_date: string;
          criado_em?: string;
          schedule: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          concurso_id?: string | null;
          start_date?: string;
          end_date?: string;
          criado_em?: string;
          schedule?: Json;
        };
      };
      flashcards: {
        Row: {
          id: string;
          front: string;
          back: string;
          disciplina: string;
          tema: string;
          subtema: string | null;
          criado_em: string;
          concurso_id: string | null;
          categoria_id: string | null;
          peso_disciplina: number | null;
        };
        Insert: {
          id?: string;
          front: string;
          back: string;
          disciplina: string;
          tema: string;
          subtema?: string | null;
          criado_em?: string;
          concurso_id?: string | null;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
        Update: {
          id?: string;
          front?: string;
          back?: string;
          disciplina?: string;
          tema?: string;
          subtema?: string | null;
          criado_em?: string;
          concurso_id?: string | null;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
      };
      progresso_usuario_flashcard: {
        Row: {
          id: string;
          user_id: string;
          flashcard_id: string;
          status: string;
          next_review: string | null;
          review_count: number;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flashcard_id: string;
          status: string;
          next_review?: string | null;
          review_count?: number;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          flashcard_id?: string;
          status?: string;
          next_review?: string | null;
          review_count?: number;
          atualizado_em?: string;
        };
      };
      apostilas: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          concurso_id: string | null;
          criado_em: string;
          categoria_id: string | null;
          disciplinas: Json | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          concurso_id?: string | null;
          criado_em?: string;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          concurso_id?: string | null;
          criado_em?: string;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
      };
      conteudo_apostila: {
        Row: {
          id: string;
          apostila_id: string;
          module_number: number;
          titulo: string;
          content_json: Json;
          criado_em: string;
          concurso_id: string | null;
        };
        Insert: {
          id?: string;
          apostila_id: string;
          module_number: number;
          titulo: string;
          content_json: Json;
          criado_em?: string;
          concurso_id?: string | null;
        };
        Update: {
          id?: string;
          apostila_id?: string;
          module_number?: number;
          titulo?: string;
          content_json?: Json;
          criado_em?: string;
          concurso_id?: string | null;
        };
      };
      progresso_usuario_apostila: {
        Row: {
          id: string;
          user_id: string;
          conteudo_apostila_id: string;
          concluido: boolean;
          percentual_progresso: number;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conteudo_apostila_id: string;
          concluido?: boolean;
          percentual_progresso?: number;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conteudo_apostila_id?: string;
          concluido?: boolean;
          percentual_progresso?: number;
          atualizado_em?: string;
        };
      };
      user_performance_cache: {
        Row: {
          id: string;
          user_id: string;
          cache_key: string;
          cache_data: Json;
          expires_at: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cache_key: string;
          cache_data: Json;
          expires_at: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cache_key?: string;
          cache_data?: Json;
          expires_at?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      logs_auditoria: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_nome: string;
          record_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_nome: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_nome?: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          criado_em?: string;
        };
      };
      cache_config: {
        Row: {
          id: string;
          cache_key: string;
          ttl_minutos: number;
          descricao: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          cache_key: string;
          ttl_minutos?: number;
          descricao?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          cache_key?: string;
          ttl_minutos?: number;
          descricao?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      estatisticas_usuario_disciplina: {
        Row: {
          id: string;
          user_id: string;
          disciplina: string;
          total_questions: number;
          resposta_corretas: number;
          pontuacao_media: number;
          tempo_estudo_minutos: number;
          last_activity: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          disciplina: string;
          total_questions?: number;
          resposta_corretas?: number;
          pontuacao_media?: number;
          tempo_estudo_minutos?: number;
          last_activity?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          disciplina?: string;
          total_questions?: number;
          resposta_corretas?: number;
          pontuacao_media?: number;
          tempo_estudo_minutos?: number;
          last_activity?: string;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
    };
  };
}
