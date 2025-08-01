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
      usuarios: {
        Row: {
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
          ativo?: boolean;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          ultimo_login?: Date;
          criado_em?: string;
          atualizado_em?: string;
          tempo_estudo_minutos?: number;
          total_questoes_respondidas?: number;
          total_resposta_corretas?: number;
          pontuacao_media?: number;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          ultimo_login?: Date;
          criado_em?: string;
          atualizado_em?: string;
          tempo_estudo_minutos?: number;
          total_questoes_respondidas?: number;
          total_resposta_corretas?: number;
          pontuacao_media?: number;
          ativo?: boolean;
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
          multiplicador_questoes?: number;
          nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
          slug?: string;
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
          multiplicador_questoes?: number;
          nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
          slug?: string;
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
          multiplicador_questoes?: number;
          nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
          slug?: string;
        };
      };
      categorias: {
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
      preferencias_usuario: {
        Row: {
          id: string;
          usuario_id: string;
          tema: 'light' | 'dark' | 'system';
          notificacoes_email: boolean;
          notificacoes_push: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          tema?: 'light' | 'dark' | 'system';
          notificacoes_email?: boolean;
          notificacoes_push?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          tema?: 'light' | 'dark' | 'system';
          notificacoes_email?: boolean;
          notificacoes_push?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database["public"]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"][PublicTableNameOrOptions]) extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database["public"]["Tables"])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"][PublicTableNameOrOptions]) extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database["public"]["Tables"])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"][PublicTableNameOrOptions]) extends {
      Update: infer U
    }
    ? U
    : never
  : never