// This file contains the consolidated database schema types for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Base user type with all user-related fields
export type User = {
  id: string
  email: string
  nome: string
  created_at: string
  updated_at: string
  full_name?: string | null
  avatar_url?: string | null
  is_active: boolean
  role: string
  // User statistics
  study_time_minutes: number
  total_questions_answered: number
  total_correct_answers: number
  average_score: number
  last_login?: string | null
  // Flashcard statistics
  total_flashcards?: number
  flashcards_studied?: number
  correct_answers_flashcards?: number
  wrong_answers_flashcards?: number
  accuracy_rate?: number
}

// Types for concurso_categorias table
export type CategoriaRow = Database['public']['Tables']['concurso_categorias']['Row']
export type CategoriaInsert = Database['public']['Tables']['concurso_categorias']['Insert']
export type CategoriaUpdate = Database['public']['Tables']['concurso_categorias']['Update']

// Types for concursos table
export type ConcursoRow = Database['public']['Tables']['concursos']['Row']
export type ConcursoInsert = Database['public']['Tables']['concursos']['Insert']
export type ConcursoUpdate = Database['public']['Tables']['concursos']['Update']

// Types for apostilas table
export type ApostilaRow = Database['public']['Tables']['apostilas']['Row']
export type ApostilaInsert = Database['public']['Tables']['apostilas']['Insert']
export type ApostilaUpdate = Database['public']['Tables']['apostilas']['Update']

// Types for apostila_content table
export type ApostilaContentRow = Database['public']['Tables']['apostila_content']['Row']
export type ApostilaContentInsert = Database['public']['Tables']['apostila_content']['Insert']
export type ApostilaContentUpdate = Database['public']['Tables']['apostila_content']['Update']

// Types for user_apostila_progress table
export type UserApostilaProgressRow = Database['public']['Tables']['user_apostila_progress']['Row']
export type UserApostilaProgressInsert = Database['public']['Tables']['user_apostila_progress']['Insert']
export type UserApostilaProgressUpdate = Database['public']['Tables']['user_apostila_progress']['Update']

export interface Database {
  public: {
    Tables: {
      // Users table
      users: {
        Row: User & {
          created_at: string;
          updated_at: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_active: boolean;
          role: string;
          total_flashcards?: number;
          flashcards_studied?: number;
          correct_answers_flashcards?: number;
          wrong_answers_flashcards?: number;
          accuracy_rate?: number;
        };
        Insert: Partial<User> & {
          email: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          role?: string;
        };
        Update: Partial<User> & {
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          role?: string;
          total_flashcards?: number;
          flashcards_studied?: number;
          correct_answers_flashcards?: number;
          wrong_answers_flashcards?: number;
          accuracy_rate?: number;
        };
      };

      // Concurso Categorias table
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

      // Concursos table
      concursos: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          data_prova: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          data_prova?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          data_prova?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Apostilas table
      apostilas: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          concurso_id: string | null;
          categoria_id: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          concurso_id?: string | null;
          categoria_id?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          concurso_id?: string | null;
          categoria_id?: string | null;
          user_id?: string;
        };
      };

      // Apostila Content table
      apostila_content: {
        Row: {
          id: string;
          apostila_id: string;
          conteudo: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          apostila_id: string;
          conteudo: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apostila_id?: string;
          conteudo?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };

      // User Apostila Progress table
      user_apostila_progress: {
        Row: {
          id: string;
          user_id: string;
          apostila_id: string;
          progresso: number;
          ultima_pagina: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          apostila_id: string;
          progresso?: number;
          ultima_pagina?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          apostila_id?: string;
          progresso?: number;
          ultima_pagina?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      // All tables should be defined above this line
      
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
      }
      
      flashcards: {
        Row: {
          id: string
          front: string
          back: string
          created_at: string
          updated_at: string
          user_id: string
          apostila_id: string
          is_active: boolean
          difficulty: number
          last_reviewed: string | null
          next_review: string | null
        }
        Insert: {
          id?: string
          front: string
          back: string
          created_at?: string
          updated_at?: string
          user_id: string
          apostila_id: string
          is_active?: boolean
          difficulty?: number
          last_reviewed?: string | null
          next_review?: string | null
        }
        Update: {
          id?: string
          front?: string
          back?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          apostila_id?: string
          is_active?: boolean
          difficulty?: number
          last_reviewed?: string | null
          next_review?: string | null
        }
      }
      
      user_flashcard_progress: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          is_correct: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          is_correct: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      user_performance_cache: {
        Row: {
          id: string
          user_id: string
          data: Json
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: Json
          created_at?: string
          updated_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: Json
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
      }
    }
    
    Views: {
      // Add view definitions if needed
    }
    
    Functions: {
      // Add function definitions if needed
      get_user_stats: {
        Args: {
          user_id: string
        }
        Returns: {
          total_flashcards: number
          flashcards_studied: number
          correct_answers: number
          wrong_answers: number
          accuracy_rate: number
        }
      }
      
      get_user_progress: {
        Args: {
          user_id: string
        }
        Returns: {
          apostila_id: string
          progress_percentage: number
          last_studied: string
        }[]
      }
    }
    
    Enums: {
      user_role: 'admin' | 'user' | 'premium'
      difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    }
  }
}
