export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos para a tabela de categorias
export type CategoriaRow = Database['public']['Tables']['concurso_categorias']['Row'];
export type CategoriaInsert = Database['public']['Tables']['concurso_categorias']['Insert'];
export type CategoriaUpdate = Database['public']['Tables']['concurso_categorias']['Update'];

// Tipos para a tabela de usuários
export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Tipos para a tabela de concursos
export type ConcursoRow = Database['public']['Tables']['concursos']['Row'];
export type ConcursoInsert = Database['public']['Tables']['concursos']['Insert'];
export type ConcursoUpdate = Database['public']['Tables']['concursos']['Update'];

// Tipos para a tabela de apostilas
export type ApostilaRow = Database['public']['Tables']['apostilas']['Row'];
export type ApostilaInsert = Database['public']['Tables']['apostilas']['Insert'];
export type ApostilaUpdate = Database['public']['Tables']['apostilas']['Update'];

// Tipos para a tabela de conteúdo de apostilas
export type ApostilaContentRow = Database['public']['Tables']['apostila_content']['Row'];
export type ApostilaContentInsert = Database['public']['Tables']['apostila_content']['Insert'];
export type ApostilaContentUpdate = Database['public']['Tables']['apostila_content']['Update'];

// Tipos para a tabela de progresso de apostilas
export type UserApostilaProgressRow = Database['public']['Tables']['user_apostila_progress']['Row'];
export type UserApostilaProgressInsert = Database['public']['Tables']['user_apostila_progress']['Insert'];
export type UserApostilaProgressUpdate = Database['public']['Tables']['user_apostila_progress']['Update'];

export interface Database {
  public: {
    Tables: {
      // Tabela de Apostilas
      apostilas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          concurso_id: string | null
          categoria_id: string | null
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          concurso_id?: string | null
          categoria_id?: string | null
        }
      }

      // Tabela de Conteúdo de Apostilas
      apostila_content: {
        Row: {
          id: string
          apostila_id: string
          module_number: number
          title: string
          content_json: Json
          created_at: string
          concurso_id: string | null
        }
        Insert: {
          id?: string
          apostila_id: string
          module_number: number
          title: string
          content_json: Json
          created_at?: string
          concurso_id?: string | null
        }
        Update: {
          id?: string
          apostila_id?: string
          module_number?: number
          title?: string
          content_json?: Json
          created_at?: string
          concurso_id?: string | null
        }
      }

      // Tabela de Progresso de Apostilas do Usuário
      user_apostila_progress: {
        Row: {
          id: string
          user_id: string
          apostila_content_id: string
          completed: boolean
          progress_percentage: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          apostila_content_id: string
          completed?: boolean
          progress_percentage?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          apostila_content_id?: string
          completed?: boolean
          progress_percentage?: number
          updated_at?: string
        }
      }

      // Tabela de Categorias de Concurso
      concurso_categorias: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          cor_primaria: string
          cor_secundaria: string
          is_active: boolean
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
          created_at?: string
          updated_at?: string
        }
      }
      
      // Tabela de Concursos
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
      }
      
      // Tabela de Usuários
      users: {
        Row: {
          id: string
          email: string
          nome: string | null
          created_at: string
          updated_at: string
          total_questions_answered: number
          total_correct_answers: number
          study_time_minutes: number
          average_score: number
        }
        Insert: {
          id?: string
          email: string
          nome?: string | null
          created_at?: string
          updated_at?: string
          total_questions_answered?: number
          total_correct_answers?: number
          study_time_minutes?: number
          average_score?: number
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          created_at?: string
          updated_at?: string
          total_questions_answered?: number
          total_correct_answers?: number
          study_time_minutes?: number
          average_score?: number
        }
      }
      
      // Adicionar outras tabelas conforme necessário
      
    }
    
    Views: {
      // Adicionar views se necessário
    }
    
    Functions: {
      // Adicionar funções do banco de dados se necessário
    }
    
    Enums: {
      // Adicionar enums se necessário
    }
  }
}