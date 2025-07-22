export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      apostilas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      cache_performance_usuario: {
        Row: {
          atualizado_em: string | null
          chave_cache: string
          criado_em: string | null
          dados_cache: Json
          expira_em: string
          id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          chave_cache: string
          criado_em?: string | null
          dados_cache: Json
          expira_em: string
          id?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          chave_cache?: string
          criado_em?: string | null
          dados_cache?: Json
          expira_em?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cache_performance_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cartoes_memorizacao: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria_id: string | null
          concurso_id: string | null
          criado_em: string | null
          disciplina: string
          frente: string
          id: string
          peso_disciplina: number | null
          subtema: string | null
          tema: string
          verso: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          disciplina: string
          frente: string
          id?: string
          peso_disciplina?: number | null
          subtema?: string | null
          tema: string
          verso: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          disciplina?: string
          frente?: string
          id?: string
          peso_disciplina?: number | null
          subtema?: string | null
          tema?: string
          verso?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_memorizacao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartoes_memorizacao_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_concursos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      concursos: {
        Row: {
          ano: number | null
          ativo: boolean | null
          atualizado_em: string | null
          banca: string | null
          categoria_id: string | null
          criado_em: string | null
          data_prova: string | null
          descricao: string | null
          id: string
          multiplicador_questoes: number | null
          nivel_dificuldade: string | null
          nome: string
          salario: number | null
          slug: string
          url_edital: string | null
          vagas: number | null
        }
        Insert: {
          ano?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          banca?: string | null
          categoria_id?: string | null
          criado_em?: string | null
          data_prova?: string | null
          descricao?: string | null
          id?: string
          multiplicador_questoes?: number | null
          nivel_dificuldade?: string | null
          nome: string
          salario?: number | null
          slug: string
          url_edital?: string | null
          vagas?: number | null
        }
        Update: {
          ano?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          banca?: string | null
          categoria_id?: string | null
          criado_em?: string | null
          data_prova?: string | null
          descricao?: string | null
          id?: string
          multiplicador_questoes?: number | null
          nivel_dificuldade?: string | null
          nome?: string
          salario?: number | null
          slug?: string
          url_edital?: string | null
          vagas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_cache: {
        Row: {
          atualizado_em: string | null
          chave_cache: string
          criado_em: string | null
          descricao: string | null
          id: string
          ttl_minutos: number
        }
        Insert: {
          atualizado_em?: string | null
          chave_cache: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ttl_minutos?: number
        }
        Update: {
          atualizado_em?: string | null
          chave_cache?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          ttl_minutos?: number
        }
        Relationships: []
      }
      configuracoes_seguranca_usuario: {
        Row: {
          atualizado_em: string | null
          autenticacao_dois_fatores: boolean | null
          criado_em: string | null
          id: string
          max_tentativas_login: number | null
          notificar_login_novo_dispositivo: boolean | null
          sessoes_multiplas_permitidas: boolean | null
          tempo_bloqueio_minutos: number | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          autenticacao_dois_fatores?: boolean | null
          criado_em?: string | null
          id?: string
          max_tentativas_login?: number | null
          notificar_login_novo_dispositivo?: boolean | null
          sessoes_multiplas_permitidas?: boolean | null
          tempo_bloqueio_minutos?: number | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          autenticacao_dois_fatores?: boolean | null
          criado_em?: string | null
          id?: string
          max_tentativas_login?: number | null
          notificar_login_novo_dispositivo?: boolean | null
          sessoes_multiplas_permitidas?: boolean | null
          tempo_bloqueio_minutos?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_seguranca_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_apostila: {
        Row: {
          apostila_id: string
          concurso_id: string | null
          conteudo_json: Json
          criado_em: string | null
          id: string
          numero_modulo: number
          titulo: string
        }
        Insert: {
          apostila_id: string
          concurso_id?: string | null
          conteudo_json: Json
          criado_em?: string | null
          id?: string
          numero_modulo: number
          titulo: string
        }
        Update: {
          apostila_id?: string
          concurso_id?: string | null
          conteudo_json?: Json
          criado_em?: string | null
          id?: string
          numero_modulo?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_apostila_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_apostila_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas_categoria: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria_id: string
          criado_em: string | null
          horas_semanais: number
          id: string
          nome: string
          ordem: number
          peso: number
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id: string
          criado_em?: string | null
          horas_semanais: number
          id?: string
          nome: string
          ordem?: number
          peso: number
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string
          criado_em?: string | null
          horas_semanais?: number
          id?: string
          nome?: string
          ordem?: number
          peso?: number
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_categoria_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      estatisticas_usuario_disciplina: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          disciplina: string
          id: string
          pontuacao_media: number | null
          tempo_estudo_minutos: number | null
          total_acertos: number | null
          total_questoes: number | null
          ultima_atividade: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          disciplina: string
          id?: string
          pontuacao_media?: number | null
          tempo_estudo_minutos?: number | null
          total_acertos?: number | null
          total_questoes?: number | null
          ultima_atividade?: string | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          disciplina?: string
          id?: string
          pontuacao_media?: number | null
          tempo_estudo_minutos?: number | null
          total_acertos?: number | null
          total_questoes?: number | null
          ultima_atividade?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estatisticas_usuario_disciplina_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_teste: {
        Row: {
          arquivo: string | null
          criado_em: string | null
          duracao: number | null
          email_usuario: string
          erro: string | null
          id: number
          nome_teste: string | null
          saida: string | null
          status: string
          usuario_id: string
        }
        Insert: {
          arquivo?: string | null
          criado_em?: string | null
          duracao?: number | null
          email_usuario: string
          erro?: string | null
          id?: number
          nome_teste?: string | null
          saida?: string | null
          status: string
          usuario_id: string
        }
        Update: {
          arquivo?: string | null
          criado_em?: string | null
          duracao?: number | null
          email_usuario?: string
          erro?: string | null
          id?: number
          nome_teste?: string | null
          saida?: string | null
          status?: string
          usuario_id?: string
        }
        Relationships: []
      }
      health_check: {
        Row: {
          id: string
          last_check: string
          status: string
          version: string
        }
        Insert: {
          id?: string
          last_check?: string
          status?: string
          version?: string
        }
        Update: {
          id?: string
          last_check?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
      historico_logs: {
        Row: {
          criado_em: string | null
          detalhes: string | null
          email_usuario: string | null
          id: number
          mensagem: string
          nivel: string
          servico: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          detalhes?: string | null
          email_usuario?: string | null
          id?: number
          mensagem: string
          nivel: string
          servico?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          detalhes?: string | null
          email_usuario?: string | null
          id?: number
          mensagem?: string
          nivel?: string
          servico?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      historico_metricas: {
        Row: {
          coletado_em: string | null
          coletado_por: string | null
          detalhes: string | null
          email_coletado_por: string | null
          id: number
          tipo: string
          unidade: string | null
          valor: number
        }
        Insert: {
          coletado_em?: string | null
          coletado_por?: string | null
          detalhes?: string | null
          email_coletado_por?: string | null
          id?: number
          tipo: string
          unidade?: string | null
          valor: number
        }
        Update: {
          coletado_em?: string | null
          coletado_por?: string | null
          detalhes?: string | null
          email_coletado_por?: string | null
          id?: number
          tipo?: string
          unidade?: string | null
          valor?: number
        }
        Relationships: []
      }
      itens_plano_estudo: {
        Row: {
          assunto: string | null
          atualizado_em: string | null
          concluido: boolean | null
          criado_em: string | null
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string | null
          disciplina: string | null
          id: string
          observacoes: string | null
          ordem: number | null
          plano_estudo_id: string
          prioridade: string | null
          status: string | null
          tempo_estimado_minutos: number | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          assunto?: string | null
          atualizado_em?: string | null
          concluido?: boolean | null
          criado_em?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_estudo_id: string
          prioridade?: string | null
          status?: string | null
          tempo_estimado_minutos?: number | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          assunto?: string | null
          atualizado_em?: string | null
          concluido?: boolean | null
          criado_em?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_estudo_id?: string
          prioridade?: string | null
          status?: string | null
          tempo_estimado_minutos?: number | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_plano_estudo_plano_estudo_id_fkey"
            columns: ["plano_estudo_id"]
            isOneToOne: false
            referencedRelation: "planos_estudo"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string
          criado_em: string | null
          endereco_ip: unknown | null
          id: string
          id_registro: string | null
          nome_tabela: string
          user_agent: string | null
          usuario_id: string | null
          valores_antigos: Json | null
          valores_novos: Json | null
        }
        Insert: {
          acao: string
          criado_em?: string | null
          endereco_ip?: unknown | null
          id?: string
          id_registro?: string | null
          nome_tabela: string
          user_agent?: string | null
          usuario_id?: string | null
          valores_antigos?: Json | null
          valores_novos?: Json | null
        }
        Update: {
          acao?: string
          criado_em?: string | null
          endereco_ip?: unknown | null
          id?: string
          id_registro?: string | null
          nome_tabela?: string
          user_agent?: string | null
          usuario_id?: string | null
          valores_antigos?: Json | null
          valores_novos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_assuntos: {
        Row: {
          categoria_id: string | null
          concurso_id: string | null
          criado_em: string | null
          disciplina: string
          id: string
          peso_disciplina: number | null
          subtema: string | null
          tema: string
        }
        Insert: {
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          disciplina: string
          id?: string
          peso_disciplina?: number | null
          subtema?: string | null
          tema: string
        }
        Update: {
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          disciplina?: string
          id?: string
          peso_disciplina?: number | null
          subtema?: string | null
          tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapa_assuntos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapa_assuntos_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_respostas: {
        Row: {
          concurso_id: string
          criado_em: string | null
          horas_disponiveis: number
          id: string
          niveis_materias: Json
          nivel_preparacao: string
          tempo_falta_concurso: string
          usuario_auth_user_id: string
        }
        Insert: {
          concurso_id: string
          criado_em?: string | null
          horas_disponiveis: number
          id?: string
          niveis_materias: Json
          nivel_preparacao: string
          tempo_falta_concurso: string
          usuario_auth_user_id: string
        }
        Update: {
          concurso_id?: string
          criado_em?: string | null
          horas_disponiveis?: number
          id?: string
          niveis_materias?: Json
          nivel_preparacao?: string
          tempo_falta_concurso?: string
          usuario_auth_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_respostas_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_respostas_usuario_auth_user_id_fkey"
            columns: ["usuario_auth_user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      planos_estudo: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria_id: string | null
          concurso_id: string | null
          criado_em: string | null
          cronograma: Json
          data_fim: string
          data_inicio: string
          descricao: string | null
          dias_semana: number[] | null
          id: string
          meta_horas_diarias: number | null
          observacoes: string | null
          titulo: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          cronograma: Json
          data_fim: string
          data_inicio: string
          descricao?: string | null
          dias_semana?: number[] | null
          id?: string
          meta_horas_diarias?: number | null
          observacoes?: string | null
          titulo?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          cronograma?: Json
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          dias_semana?: number[] | null
          id?: string
          meta_horas_diarias?: number | null
          observacoes?: string | null
          titulo?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_estudo_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_estudo_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_estudo_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_usuario: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          notificacoes_email: boolean
          notificacoes_push: boolean
          tema: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          tema?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          tema?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_usuario_concurso: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          concurso_id: string
          criado_em: string | null
          id: string
          pode_alterar_ate: string
          selecionado_em: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          concurso_id: string
          criado_em?: string | null
          id?: string
          pode_alterar_ate: string
          selecionado_em?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          concurso_id?: string
          criado_em?: string | null
          id?: string
          pode_alterar_ate?: string
          selecionado_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_usuario_concurso_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferencias_usuario_concurso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_usuario_apostila: {
        Row: {
          atualizado_em: string | null
          concluido: boolean | null
          conteudo_apostila_id: string
          id: string
          percentual_progresso: number | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          concluido?: boolean | null
          conteudo_apostila_id: string
          id?: string
          percentual_progresso?: number | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          concluido?: boolean | null
          conteudo_apostila_id?: string
          id?: string
          percentual_progresso?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_apostila_conteudo_apostila_id_fkey"
            columns: ["conteudo_apostila_id"]
            isOneToOne: false
            referencedRelation: "conteudo_apostila"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_usuario_apostila_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_usuario_flashcard: {
        Row: {
          atualizado_em: string | null
          contador_revisoes: number | null
          flashcard_id: string
          id: string
          proxima_revisao: string | null
          status: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          contador_revisoes?: number | null
          flashcard_id: string
          id?: string
          proxima_revisao?: string | null
          status?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          contador_revisoes?: number | null
          flashcard_id?: string
          id?: string
          proxima_revisao?: string | null
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_flashcard_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "cartoes_memorizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_usuario_flashcard_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_usuario_mapa_assuntos: {
        Row: {
          atualizado_em: string | null
          id: string
          mapa_assunto_id: string
          status: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          id?: string
          mapa_assunto_id: string
          status?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          id?: string
          mapa_assunto_id?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_mapa_assuntos_mapa_assunto_id_fkey"
            columns: ["mapa_assunto_id"]
            isOneToOne: false
            referencedRelation: "mapa_assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_usuario_mapa_assuntos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_usuario_questoes_semanais: {
        Row: {
          concluido_em: string | null
          id: string
          pontuacao: number
          questoes_semanais_id: string
          respostas: Json
          total_questoes: number | null
          usuario_id: string
        }
        Insert: {
          concluido_em?: string | null
          id?: string
          pontuacao: number
          questoes_semanais_id: string
          respostas: Json
          total_questoes?: number | null
          usuario_id: string
        }
        Update: {
          concluido_em?: string | null
          id?: string
          pontuacao?: number
          questoes_semanais_id?: string
          respostas?: Json
          total_questoes?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_questoes_semanais_questoes_semanais_id_fkey"
            columns: ["questoes_semanais_id"]
            isOneToOne: false
            referencedRelation: "questoes_semanais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_usuario_questoes_semanais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_usuario_simulado: {
        Row: {
          concluido_em: string | null
          id: string
          pontuacao: number
          respostas: Json
          simulado_id: string
          tempo_gasto_minutos: number
          usuario_id: string
        }
        Insert: {
          concluido_em?: string | null
          id?: string
          pontuacao: number
          respostas: Json
          simulado_id: string
          tempo_gasto_minutos: number
          usuario_id: string
        }
        Update: {
          concluido_em?: string | null
          id?: string
          pontuacao?: number
          respostas?: Json
          simulado_id?: string
          tempo_gasto_minutos?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_usuario_simulado_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_usuario_simulado_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_semanais: {
        Row: {
          ano: number
          assunto: string | null
          ativo: boolean | null
          concurso_id: string | null
          criado_em: string | null
          data_expiracao: string | null
          data_publicacao: string | null
          descricao: string | null
          dificuldade: string | null
          disciplina: string | null
          id: string
          numero_semana: number
          pontos: number | null
          questoes: Json
          titulo: string
        }
        Insert: {
          ano: number
          assunto?: string | null
          ativo?: boolean | null
          concurso_id?: string | null
          criado_em?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          dificuldade?: string | null
          disciplina?: string | null
          id?: string
          numero_semana: number
          pontos?: number | null
          questoes: Json
          titulo: string
        }
        Update: {
          ano?: number
          assunto?: string | null
          ativo?: boolean | null
          concurso_id?: string | null
          criado_em?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          dificuldade?: string | null
          disciplina?: string | null
          id?: string
          numero_semana?: number
          pontos?: number | null
          questoes?: Json
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_semanais_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_simulado: {
        Row: {
          alternativas: Json
          assunto: string | null
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          dificuldade: string | null
          disciplina: string | null
          enunciado: string
          explicacao: string | null
          id: string
          numero_questao: number
          ordem: number | null
          peso_disciplina: number | null
          resposta_correta: string
          simulado_id: string
        }
        Insert: {
          alternativas: Json
          assunto?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          dificuldade?: string | null
          disciplina?: string | null
          enunciado: string
          explicacao?: string | null
          id?: string
          numero_questao: number
          ordem?: number | null
          peso_disciplina?: number | null
          resposta_correta: string
          simulado_id: string
        }
        Update: {
          alternativas?: Json
          assunto?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          dificuldade?: string | null
          disciplina?: string | null
          enunciado?: string
          explicacao?: string | null
          id?: string
          numero_questao?: number
          ordem?: number | null
          peso_disciplina?: number | null
          resposta_correta?: string
          simulado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_simulado_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_questoes_semanais: {
        Row: {
          correta: boolean | null
          criado_em: string | null
          id: string
          pontos_ganhos: number | null
          questao_semanal_id: string
          resposta_escolhida: string
          tempo_gasto_segundos: number | null
          usuario_id: string
        }
        Insert: {
          correta?: boolean | null
          criado_em?: string | null
          id?: string
          pontos_ganhos?: number | null
          questao_semanal_id: string
          resposta_escolhida: string
          tempo_gasto_segundos?: number | null
          usuario_id: string
        }
        Update: {
          correta?: boolean | null
          criado_em?: string | null
          id?: string
          pontos_ganhos?: number | null
          questao_semanal_id?: string
          resposta_escolhida?: string
          tempo_gasto_segundos?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_questoes_semanais_questao_semanal_id_fkey"
            columns: ["questao_semanal_id"]
            isOneToOne: false
            referencedRelation: "questoes_semanais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_questoes_semanais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_usuario: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          dispositivo: string | null
          expira_em: string
          id: string
          ip_address: unknown | null
          token_hash: string
          ultimo_acesso: string | null
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          dispositivo?: string | null
          expira_em: string
          id?: string
          ip_address?: unknown | null
          token_hash: string
          ultimo_acesso?: string | null
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          dispositivo?: string | null
          expira_em?: string
          id?: string
          ip_address?: unknown | null
          token_hash?: string
          ultimo_acesso?: string | null
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria_id: string | null
          concurso_id: string | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          dificuldade: string
          disciplinas: Json | null
          id: string
          numero_questoes: number
          publico: boolean | null
          slug: string
          tempo_minutos: number
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          dificuldade?: string
          disciplinas?: Json | null
          id?: string
          numero_questoes?: number
          publico?: boolean | null
          slug: string
          tempo_minutos?: number
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_id?: string | null
          concurso_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          dificuldade?: string
          disciplinas?: Json | null
          id?: string
          numero_questoes?: number
          publico?: boolean | null
          slug?: string
          tempo_minutos?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulados_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_login: {
        Row: {
          email: string
          id: string
          ip_address: unknown
          motivo_falha: string | null
          sucesso: boolean | null
          tentativa_em: string | null
          user_agent: string | null
        }
        Insert: {
          email: string
          id?: string
          ip_address: unknown
          motivo_falha?: string | null
          sucesso?: boolean | null
          tentativa_em?: string | null
          user_agent?: string | null
        }
        Update: {
          email?: string
          id?: string
          ip_address?: unknown
          motivo_falha?: string | null
          sucesso?: boolean | null
          tentativa_em?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      tokens_recuperacao: {
        Row: {
          criado_em: string | null
          expira_em: string
          id: string
          token_hash: string
          usado: boolean | null
          usado_em: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string | null
          expira_em: string
          id?: string
          token_hash: string
          usado?: boolean | null
          usado_em?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string | null
          expira_em?: string
          id?: string
          token_hash?: string
          usado?: boolean | null
          usado_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_recuperacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          auth_user_id: string | null
          criado_em: string | null
          email: string
          id: string
          nome: string
          pontuacao_media: number | null
          primeiro_login: boolean | null
          role: string
          senha_hash: string
          tempo_estudo_minutos: number | null
          total_acertos: number | null
          total_questoes_respondidas: number | null
          ultimo_login: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email: string
          id?: string
          nome: string
          pontuacao_media?: number | null
          primeiro_login?: boolean | null
          role?: string
          senha_hash: string
          tempo_estudo_minutos?: number | null
          total_acertos?: number | null
          total_questoes_respondidas?: number | null
          ultimo_login?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
          pontuacao_media?: number | null
          primeiro_login?: boolean | null
          role?: string
          senha_hash?: string
          tempo_estudo_minutos?: number | null
          total_acertos?: number | null
          total_questoes_respondidas?: number | null
          ultimo_login?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      view_estatisticas_login: {
        Row: {
          data: string | null
          falhas: number | null
          ips_unicos: number | null
          sucessos: number | null
          total_tentativas: number | null
          usuarios_unicos: number | null
        }
        Relationships: []
      }
      view_sessoes_ativas: {
        Row: {
          criado_em: string | null
          dispositivo: string | null
          email: string | null
          expira_em: string | null
          id: string | null
          ip_address: unknown | null
          nome: string | null
          ultimo_acesso: string | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_ultimo_acesso_sessao: {
        Args: { p_token_hash: string }
        Returns: undefined
      }
      cleanup_old_connection_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      invalidar_sessoes_usuario: {
        Args: { p_usuario_id: string; p_exceto_token_hash?: string }
        Returns: undefined
      }
      limpar_sessoes_expiradas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verificar_tentativas_suspeitas: {
        Args: {
          p_email: string
          p_ip_address: unknown
          p_max_tentativas?: number
          p_janela_minutos?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const 