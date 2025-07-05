export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type User = {
  id: string;
  email: string;
  nome: string;
  created_at: string;
  updated_at: string;
  study_time_minutes: number;
  total_questions_answered: number;
  total_correct_answers: number;
  average_score: number;
  last_login?: Date;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      concurso_categorias: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          descricao: string | null;
          cor_primaria: string;
          cor_secundaria: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          descricao?: string | null;
          cor_primaria?: string;
          cor_secundaria?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          descricao?: string | null;
          cor_primaria?: string;
          cor_secundaria?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categoria_disciplinas: {
        Row: {
          id: string;
          categoria_id: string;
          nome: string;
          peso: number;
          horas_semanais: number;
          ordem: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          categoria_id: string;
          nome: string;
          peso: number;
          horas_semanais: number;
          ordem: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string;
          nome?: string;
          peso?: number;
          horas_semanais?: number;
          ordem?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_concurso_preferences: {
        Row: {
          id: string;
          user_id: string;
          concurso_id: string;
          selected_at: string;
          can_change_until: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concurso_id: string;
          selected_at?: string;
          can_change_until: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          concurso_id?: string;
          selected_at?: string;
          can_change_until?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      concursos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          ano: number | null;
          banca: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
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
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
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
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
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
          title: string;
          description: string | null;
          questions_count: number;
          time_minutes: number;
          difficulty: string;
          created_at: string;
          concurso_id: string | null;
          is_public: boolean;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
          categoria_id: string | null;
          disciplinas: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          questions_count: number;
          time_minutes: number;
          difficulty: string;
          created_at?: string;
          concurso_id?: string | null;
          is_public?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          questions_count?: number;
          time_minutes?: number;
          difficulty?: string;
          created_at?: string;
          concurso_id?: string | null;
          is_public?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
      };
      simulado_questions: {
        Row: {
          id: string;
          simulado_id: string;
          question_number: number;
          question_text: string;
          alternatives: Json;
          correct_answer: string;
          explanation: string | null;

          topic: string | null;
          difficulty: string | null;
          created_at: string;
          updated_at: string;
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
          question_text: string;
          alternatives: Json;
          correct_answer: string;
          explanation?: string | null;
          topic?: string | null;
          difficulty?: string | null;
          created_at?: string;
          updated_at?: string;
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
          question_text?: string;
          alternatives?: Json;
          correct_answer?: string;
          explanation?: string | null;
          topic?: string | null;
          difficulty?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          concurso_id?: string | null;
          categoria_id?: string | null;
          disciplina?: string | null;
          peso_disciplina?: number | null;
        };
      };
      user_simulado_progress: {
        Row: {
          id: string;
          user_id: string;
          simulado_id: string;
          score: number;
          completed_at: string;
          time_taken_minutes: number;
          answers: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          simulado_id: string;
          score: number;
          completed_at?: string;
          time_taken_minutes: number;
          answers: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          simulado_id?: string;
          score?: number;
          completed_at?: string;
          time_taken_minutes?: number;
          answers?: Json;
        };
      };
      questoes_semanais: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          week_number: number;
          year: number;
          created_at: string;
          concurso_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          week_number: number;
          year: number;
          created_at?: string;
          concurso_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          week_number?: number;
          year?: number;
          created_at?: string;
          concurso_id?: string | null;
        };
      };
      user_questoes_semanais_progress: {
        Row: {
          id: string;
          user_id: string;
          questoes_semanais_id: string;
          score: number;
          completed_at: string;
          answers: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          questoes_semanais_id: string;
          score: number;
          completed_at?: string;
          answers: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          questoes_semanais_id?: string;
          score?: number;
          completed_at?: string;
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
          created_at: string;
          categoria_id: string | null;
          peso_disciplina: number | null;
        };
        Insert: {
          id?: string;
          disciplina: string;
          tema: string;
          subtema?: string | null;
          concurso_id?: string | null;
          created_at?: string;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
        Update: {
          id?: string;
          disciplina?: string;
          tema?: string;
          subtema?: string | null;
          concurso_id?: string | null;
          created_at?: string;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
      };
      user_mapa_assuntos_status: {
        Row: {
          id: string;
          user_id: string;
          mapa_assunto_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mapa_assunto_id: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mapa_assunto_id?: string;
          status?: string;
          updated_at?: string;
        };
      };
      planos_estudo: {
        Row: {
          id: string;
          user_id: string;
          concurso_id: string | null;
          start_date: string;
          end_date: string;
          created_at: string;
          schedule: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          concurso_id?: string | null;
          start_date: string;
          end_date: string;
          created_at?: string;
          schedule: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          concurso_id?: string | null;
          start_date?: string;
          end_date?: string;
          created_at?: string;
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
          created_at: string;
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
          created_at?: string;
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
          created_at?: string;
          concurso_id?: string | null;
          categoria_id?: string | null;
          peso_disciplina?: number | null;
        };
      };
      user_flashcard_progress: {
        Row: {
          id: string;
          user_id: string;
          flashcard_id: string;
          status: string;
          next_review: string | null;
          review_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flashcard_id: string;
          status: string;
          next_review?: string | null;
          review_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          flashcard_id?: string;
          status?: string;
          next_review?: string | null;
          review_count?: number;
          updated_at?: string;
        };
      };
      apostilas: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          concurso_id: string | null;
          created_at: string;
          categoria_id: string | null;
          disciplinas: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          concurso_id?: string | null;
          created_at?: string;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          concurso_id?: string | null;
          created_at?: string;
          categoria_id?: string | null;
          disciplinas?: Json | null;
        };
      };
      apostila_content: {
        Row: {
          id: string;
          apostila_id: string;
          module_number: number;
          title: string;
          content_json: Json;
          created_at: string;
          concurso_id: string | null;
        };
        Insert: {
          id?: string;
          apostila_id: string;
          module_number: number;
          title: string;
          content_json: Json;
          created_at?: string;
          concurso_id?: string | null;
        };
        Update: {
          id?: string;
          apostila_id?: string;
          module_number?: number;
          title?: string;
          content_json?: Json;
          created_at?: string;
          concurso_id?: string | null;
        };
      };
      user_apostila_progress: {
        Row: {
          id: string;
          user_id: string;
          apostila_content_id: string;
          completed: boolean;
          progress_percentage: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          apostila_content_id: string;
          completed?: boolean;
          progress_percentage?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          apostila_content_id?: string;
          completed?: boolean;
          progress_percentage?: number;
          updated_at?: string;
        };
      };
      user_performance_cache: {
        Row: {
          id: string;
          user_id: string;
          cache_key: string;
          cache_data: Json;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cache_key: string;
          cache_data: Json;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cache_key?: string;
          cache_data?: Json;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      cache_config: {
        Row: {
          id: string;
          cache_key: string;
          ttl_minutes: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cache_key: string;
          ttl_minutes: number;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cache_key?: string;
          ttl_minutes?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_discipline_stats: {
        Row: {
          id: string;
          user_id: string;
          disciplina: string;
          total_questions: number;
          correct_answers: number;
          average_score: number;
          study_time_minutes: number;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          disciplina: string;
          total_questions?: number;
          correct_answers?: number;
          average_score?: number;
          study_time_minutes?: number;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          disciplina?: string;
          total_questions?: number;
          correct_answers?: number;
          average_score?: number;
          study_time_minutes?: number;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
