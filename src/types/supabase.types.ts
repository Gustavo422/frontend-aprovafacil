export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      apostila_content: {
        Row: {
          id: string
          apostila_id: string
          module_number: number
          title: string
          content_json: Json
          created_at: string
          updated_at: string
          is_active: boolean
          order_index: number
        }
        Insert: {
          id?: string
          apostila_id: string
          module_number: number
          title: string
          content_json: Json
          created_at?: string
          updated_at?: string
          is_active?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          apostila_id?: string
          module_number?: number
          title?: string
          content_json?: Json
          created_at?: string
          updated_at?: string
          is_active?: boolean
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "apostila_content_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          }
        ]
      }
      apostilas: {
        Row: {
          id: string
          title: string
          description: string | null
          concurso_id: string | null
          created_at: string
          categoria_id: string | null
          disciplinas: Json | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          concurso_id?: string | null
          created_at?: string
          categoria_id?: string | null
          disciplinas?: Json | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          concurso_id?: string | null
          created_at?: string
          categoria_id?: string | null
          disciplinas?: Json | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostilas_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostilas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cache_config: {
        Row: {
          id: string
          cache_key: string
          ttl_minutos: number
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cache_key: string
          ttl_minutos?: number
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cache_key?: string
          ttl_minutos?: number
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categoria_disciplinas: {
        Row: {
          id: string
          categoria_id: string
          nome: string
          peso: number
          horas_semanais: number
          ordem: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          categoria_id: string
          nome: string
          peso: number
          horas_semanais: number
          ordem?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          categoria_id?: string
          nome?: string
          peso?: number
          horas_semanais?: number
          ordem?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categoria_disciplinas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      concurso_categorias: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          cor_primaria: string
          cor_secundaria: string
          is_active: boolean
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          descricao?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          is_active?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          descricao?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          is_active?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concurso_categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      concursos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ano: number | null
          banca: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          categoria_id: string | null
          edital_url: string | null
          data_prova: string | null
          vagas: number | null
          salario: number | null
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          ano?: number | null
          banca?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          categoria_id?: string | null
          edital_url?: string | null
          data_prova?: string | null
          vagas?: number | null
          salario?: number | null
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          ano?: number | null
          banca?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          categoria_id?: string | null
          edital_url?: string | null
          data_prova?: string | null
          vagas?: number | null
          salario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      flashcards: {
        Row: {
          id: string
          front: string
          back: string
          disciplina: string
          tema: string
          subtema: string | null
          created_at: string
          updated_at: string
          concurso_id: string | null
          categoria_id: string | null
          peso_disciplina: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          front: string
          back: string
          disciplina: string
          tema: string
          subtema?: string | null
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          front?: string
          back?: string
          disciplina?: string
          tema?: string
          subtema?: string | null
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      mapa_assuntos: {
        Row: {
          id: string
          disciplina: string
          tema: string
          subtema: string | null
          descricao: string | null
          ordem: number
          is_active: boolean
          created_at: string
          updated_at: string
          concurso_id: string | null
          categoria_id: string | null
          peso_disciplina: number | null
        }
        Insert: {
          id?: string
          disciplina: string
          tema: string
          subtema?: string | null
          descricao?: string | null
          ordem?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
        }
        Update: {
          id?: string
          disciplina?: string
          tema?: string
          subtema?: string | null
          descricao?: string | null
          ordem?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mapa_assuntos_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapa_assuntos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      plano_estudo_itens: {
        Row: {
          id: string
          plano_estudo_id: string
          tipo_item: string
          item_id: string
          dia_semana: number | null
          ordem: number
          tempo_estimado_minutos: number
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plano_estudo_id: string
          tipo_item: string
          item_id: string
          dia_semana?: number | null
          ordem?: number
          tempo_estimado_minutos?: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plano_estudo_id?: string
          tipo_item?: string
          item_id?: string
          dia_semana?: number | null
          ordem?: number
          tempo_estimado_minutos?: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_estudo_itens_plano_estudo_id_fkey"
            columns: ["plano_estudo_id"]
            isOneToOne: false
            referencedRelation: "planos_estudo"
            referencedColumns: ["id"]
          }
        ]
      }
      planos_estudo: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          is_active: boolean
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
          concurso_id: string | null
          categoria_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao?: string | null
          is_active?: boolean
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string | null
          is_active?: boolean
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_estudo_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_estudo_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_estudo_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      questoes_semanais: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          semana_numero: number
          ano: number
          is_active: boolean
          data_liberacao: string
          data_encerramento: string
          created_at: string
          updated_at: string
          concurso_id: string | null
          categoria_id: string | null
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          semana_numero: number
          ano: number
          is_active?: boolean
          data_liberacao: string
          data_encerramento: string
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          semana_numero?: number
          ano?: number
          is_active?: boolean
          data_liberacao?: string
          data_encerramento?: string
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_semanais_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_semanais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      simulado_questoes: {
        Row: {
          id: string
          simulado_id: string
          enunciado: string
          alternativas: Json
          resposta_correta: string
          explicacao: string | null
          disciplina: string | null
          assunto: string | null
          dificuldade: string
          ordem: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          concurso_id: string | null
          categoria_id: string | null
          peso_disciplina: number | null
        }
        Insert: {
          id?: string
          simulado_id: string
          enunciado: string
          alternativas: Json
          resposta_correta: string
          explicacao?: string | null
          disciplina?: string | null
          assunto?: string | null
          dificuldade?: string
          ordem?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
        }
        Update: {
          id?: string
          simulado_id?: string
          enunciado?: string
          alternativas?: Json
          resposta_correta?: string
          explicacao?: string | null
          disciplina?: string | null
          assunto?: string | null
          dificuldade?: string
          ordem?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          concurso_id?: string | null
          categoria_id?: string | null
          peso_disciplina?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulado_questoes_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulado_questoes_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulado_questoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      simulados: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          num_questoes: number
          tempo_minutos: number
          dificuldade: string
          is_public: boolean
          is_active: boolean
          data_inicio: string | null
          data_fim: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          concurso_id: string | null
          categoria_id: string | null
          disciplinas: Json | null
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          num_questoes?: number
          tempo_minutos?: number
          dificuldade?: string
          is_public?: boolean
          is_active?: boolean
          data_inicio?: string | null
          data_fim?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          concurso_id?: string | null
          categoria_id?: string | null
          disciplinas?: Json | null
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          num_questoes?: number
          tempo_minutos?: number
          dificuldade?: string
          is_public?: boolean
          is_active?: boolean
          data_inicio?: string | null
          data_fim?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          concurso_id?: string | null
          categoria_id?: string | null
          disciplinas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "simulados_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "concurso_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_apostila_progress: {
        Row: {
          id: string
          user_id: string
          apostila_content_id: string
          completed: boolean
          progress_percentage: number
          last_accessed: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          apostila_content_id: string
          completed?: boolean
          progress_percentage?: number
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          apostila_content_id?: string
          completed?: boolean
          progress_percentage?: number
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_apostila_progress_apostila_content_id_fkey"
            columns: ["apostila_content_id"]
            isOneToOne: false
            referencedRelation: "apostila_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_apostila_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_concurso_preferences: {
        Row: {
          id: string
          user_id: string
          concurso_id: string
          selected_at: string
          can_change_until: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          concurso_id: string
          selected_at?: string
          can_change_until: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          concurso_id?: string
          selected_at?: string
          can_change_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_concurso_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_concurso_preferences_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          }
        ]
      }
      user_discipline_stats: {
        Row: {
          id: string
          user_id: string
          disciplina: string
          total_questions: number
          correct_answers: number
          average_score: number
          study_time_minutes: number
          last_activity: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          disciplina: string
          total_questions?: number
          correct_answers?: number
          average_score?: number
          study_time_minutes?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          disciplina?: string
          total_questions?: number
          correct_answers?: number
          average_score?: number
          study_time_minutes?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_discipline_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_flashcard_progress: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          status: string
          next_review: string | null
          review_count: number
          ease_factor: number
          interval_days: number
          last_reviewed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          status?: string
          next_review?: string | null
          review_count?: number
          ease_factor?: number
          interval_days?: number
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          status?: string
          next_review?: string | null
          review_count?: number
          ease_factor?: number
          interval_days?: number
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_mapa_assuntos_status: {
        Row: {
          id: string
          user_id: string
          mapa_assunto_id: string
          status: string
          last_studied: string | null
          study_count: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mapa_assunto_id: string
          status?: string
          last_studied?: string | null
          study_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mapa_assunto_id?: string
          status?: string
          last_studied?: string | null
          study_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mapa_assuntos_status_mapa_assunto_id_fkey"
            columns: ["mapa_assunto_id"]
            isOneToOne: false
            referencedRelation: "mapa_assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mapa_assuntos_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_performance_cache: {
        Row: {
          id: string
          user_id: string
          cache_key: string
          cache_data: Json
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cache_key: string
          cache_data: Json
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cache_key?: string
          cache_data?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_performance_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_questoes_semanais_progress: {
        Row: {
          id: string
          user_id: string
          questoes_semanais_id: string
          score: number
          respostas_corretas: number
          total_questoes: number
          tempo_gasto_minutos: number | null
          data_conclusao: string | null
          respostas: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          questoes_semanais_id: string
          score: number
          respostas_corretas?: number
          total_questoes?: number
          tempo_gasto_minutos?: number | null
          data_conclusao?: string | null
          respostas?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          questoes_semanais_id?: string
          score?: number
          respostas_corretas?: number
          total_questoes?: number
          tempo_gasto_minutos?: number | null
          data_conclusao?: string | null
          respostas?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questoes_semanais_progress_questoes_semanais_id_fkey"
            columns: ["questoes_semanais_id"]
            isOneToOne: false
            referencedRelation: "questoes_semanais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questoes_semanais_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_simulado_progress: {
        Row: {
          id: string
          user_id: string
          simulado_id: string
          data_inicio: string
          data_fim: string | null
          tempo_gasto_segundos: number | null
          respostas: Json | null
          pontuacao: number | null
          acertos: number
          erros: number
          em_branco: number
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          simulado_id: string
          data_inicio: string
          data_fim?: string | null
          tempo_gasto_segundos?: number | null
          respostas?: Json | null
          pontuacao?: number | null
          acertos?: number
          erros?: number
          em_branco?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          simulado_id?: string
          data_inicio?: string
          data_fim?: string | null
          tempo_gasto_segundos?: number | null
          respostas?: Json | null
          pontuacao?: number | null
          acertos?: number
          erros?: number
          em_branco?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_simulado_progress_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_simulado_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          last_login: string | null
          created_at: string
          updated_at: string
          total_questions_answered: number
          total_correct_answers: number
          study_time_minutes: number
          average_score: number
        }
        Insert: {
          id?: string
          name: string
          email: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
          total_questions_answered?: number
          total_correct_answers?: number
          study_time_minutes?: number
          average_score?: number
        }
        Update: {
          id?: string
          name?: string
          email?: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
          total_questions_answered?: number
          total_correct_answers?: number
          study_time_minutes?: number
          average_score?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Specific types for common entities
export type Concurso = Tables<'concursos'>
export type ConcursoCategoria = Tables<'concurso_categorias'>
export type Apostila = Tables<'apostilas'>
export type ApostilaContent = Tables<'apostila_content'>
export type Flashcard = Tables<'flashcards'>
export type Simulado = Tables<'simulados'>
export type SimuladoQuestao = Tables<'simulado_questoes'>
export type User = Tables<'users'>
export type MapaAssunto = Tables<'mapa_assuntos'>
export type PlanoEstudo = Tables<'planos_estudo'>
export type PlanoEstudoItem = Tables<'plano_estudo_itens'>
export type QuestoesSemana = Tables<'questoes_semanais'>
export type UserApostilaProgress = Tables<'user_apostila_progress'>
export type UserFlashcardProgress = Tables<'user_flashcard_progress'>
export type UserSimuladoProgress = Tables<'user_simulado_progress'>
export type UserDisciplineStats = Tables<'user_discipline_stats'>
export type UserMapaAssuntosStatus = Tables<'user_mapa_assuntos_status'>
export type UserConcursoPreferences = Tables<'user_concurso_preferences'>
export type UserQuestoesSemanaProgress = Tables<'user_questoes_semanais_progress'>
export type CachConfig = Tables<'cache_config'>
export type UserPerformanceCache = Tables<'user_performance_cache'>
export type AuditLog = Tables<'audit_logs'>
export type CategoriaDisciplina = Tables<'categoria_disciplinas'>

