import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  table_name: string;
}

interface TableInfo {
  table_name: string;
  columns: TableColumn[];
}

interface ExpectedColumn {
  type: string;
  nullable: boolean;
  default: string | null;
}

interface ExpectedSchema {
  [tableName: string]: {
    [columnName: string]: ExpectedColumn;
  };
}

interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tables: {
    [tableName: string]: {
      exists: boolean;
      columns: {
        [columnName: string]: {
          exists: boolean;
          type: string;
          nullable: boolean;
          default: string | null;
        };
      };
    };
  };
  summary: {
    totalTables: number;
    validTables: number;
    totalColumns: number;
    validColumns: number;
    missingTables: string[];
    missingColumns: string[];
    typeConflicts: string[];
  };
}

// Definição das tabelas e colunas esperadas pelo código
const EXPECTED_SCHEMA: ExpectedSchema = {
  users: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    email: { type: 'text', nullable: false, default: null },
    name: { type: 'text', nullable: false, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    total_questions_answered: { type: 'integer', nullable: true, default: '0' },
    total_correct_answers: { type: 'integer', nullable: true, default: '0' },
    study_time_minutes: { type: 'integer', nullable: true, default: '0' },
    average_score: { type: 'numeric', nullable: true, default: '0' },
    last_login: { type: 'timestamp with time zone', nullable: true, default: null },
  },
  concurso_categorias: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    nome: { type: 'character varying', nullable: false, default: null },
    slug: { type: 'character varying', nullable: false, default: null },
    descricao: { type: 'text', nullable: true, default: null },
    cor_primaria: { type: 'character varying', nullable: true, default: "'#2563EB'" },
    cor_secundaria: { type: 'character varying', nullable: true, default: "'#1E40AF'" },
    is_active: { type: 'boolean', nullable: true, default: 'true' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  categoria_disciplinas: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    categoria_id: { type: 'uuid', nullable: false, default: null },
    nome: { type: 'character varying', nullable: false, default: null },
    peso: { type: 'integer', nullable: false, default: null },
    horas_semanais: { type: 'integer', nullable: false, default: null },
    ordem: { type: 'integer', nullable: false, default: '0' },
    is_active: { type: 'boolean', nullable: true, default: 'true' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  concursos: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    nome: { type: 'character varying', nullable: false, default: null },
    descricao: { type: 'text', nullable: true, default: null },
    ano: { type: 'integer', nullable: true, default: null },
    banca: { type: 'character varying', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    edital_url: { type: 'text', nullable: true, default: null },
    data_prova: { type: 'date', nullable: true, default: null },
    vagas: { type: 'integer', nullable: true, default: null },
    salario: { type: 'numeric', nullable: true, default: null },
    is_active: { type: 'boolean', nullable: true, default: 'true' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  simulados_personalizados: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    title: { type: 'character varying', nullable: false, default: null },
    description: { type: 'text', nullable: true, default: null },
    questions_count: { type: 'integer', nullable: false, default: '0' },
    time_minutes: { type: 'integer', nullable: false, default: null },
    difficulty: { type: 'character varying', nullable: false, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'now()' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'now()' },
    deleted_at: { type: 'timestamp with time zone', nullable: true, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    is_public: { type: 'boolean', nullable: true, default: 'false' },
    created_by: { type: 'uuid', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    disciplinas: { type: 'jsonb', nullable: true, default: null },
    slug: { type: 'character varying', nullable: true, default: null },
  },
  simulado_questions: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    simulado_id: { type: 'uuid', nullable: false, default: null },
    question_number: { type: 'integer', nullable: false, default: null },
    question_text: { type: 'text', nullable: false, default: null },
    alternatives: { type: 'jsonb', nullable: false, default: null },
    correct_answer: { type: 'character varying', nullable: false, default: null },
    explanation: { type: 'text', nullable: true, default: null },
    topic: { type: 'character varying', nullable: true, default: null },
    difficulty: { type: 'character varying', nullable: true, default: null },
    deleted_at: { type: 'timestamp with time zone', nullable: true, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    peso_disciplina: { type: 'integer', nullable: true, default: null },
    disciplina: { type: 'character varying', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    discipline: { type: 'character varying', nullable: true, default: null },
  },
  user_simulado_progress: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    simulado_id: { type: 'uuid', nullable: false, default: null },
    score: { type: 'numeric', nullable: false, default: null },
    time_taken_minutes: { type: 'integer', nullable: false, default: null },
    answers: { type: 'jsonb', nullable: false, default: null },
    completed_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  cartoes_memorizacao: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    front: { type: 'text', nullable: false, default: null },
    back: { type: 'text', nullable: false, default: null },
    tema: { type: 'character varying', nullable: false, default: null },
    subtema: { type: 'character varying', nullable: true, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    peso_disciplina: { type: 'integer', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    disciplina: { type: 'character varying', nullable: false, default: null },
  },
  user_flashcard_progress: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    flashcard_id: { type: 'uuid', nullable: false, default: null },
    next_review: { type: 'timestamp with time zone', nullable: true, default: null },
    status: { type: 'character varying', nullable: false, default: "'não_iniciado'" },
    review_count: { type: 'integer', nullable: true, default: '0' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  apostila_inteligente: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    title: { type: 'character varying', nullable: false, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'now()' },
    description: { type: 'text', nullable: true, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    disciplinas: { type: 'jsonb', nullable: true, default: null },
    slug: { type: 'character varying', nullable: true, default: null },
    created_by: { type: 'uuid', nullable: true, default: null },
  },
  apostila_content: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    apostila_id: { type: 'uuid', nullable: false, default: null },
    module_number: { type: 'integer', nullable: false, default: null },
    title: { type: 'character varying', nullable: false, default: null },
    content_json: { type: 'jsonb', nullable: false, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  user_apostila_progress: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    apostila_content_id: { type: 'uuid', nullable: false, default: null },
    completed: { type: 'boolean', nullable: true, default: 'false' },
    progress_percentage: { type: 'numeric', nullable: true, default: '0' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  questoes_semanais: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    title: { type: 'character varying', nullable: false, default: null },
    description: { type: 'text', nullable: true, default: null },
    week_number: { type: 'integer', nullable: false, default: null },
    year: { type: 'integer', nullable: false, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  user_questoes_semanais_progress: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    questoes_semanais_id: { type: 'uuid', nullable: false, default: null },
    score: { type: 'numeric', nullable: false, default: null },
    answers: { type: 'jsonb', nullable: false, default: null },
    completed_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  mapa_assuntos: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    tema: { type: 'character varying', nullable: false, default: null },
    subtema: { type: 'character varying', nullable: true, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    categoria_id: { type: 'uuid', nullable: true, default: null },
    peso_disciplina: { type: 'integer', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    disciplina: { type: 'character varying', nullable: false, default: null },
  },
  user_mapa_assuntos_status: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    mapa_assunto_id: { type: 'uuid', nullable: false, default: null },
    status: { type: 'character varying', nullable: false, default: "'não_iniciado'" },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  planos_estudo: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    concurso_id: { type: 'uuid', nullable: true, default: null },
    start_date: { type: 'date', nullable: false, default: null },
    end_date: { type: 'date', nullable: false, default: null },
    schedule: { type: 'jsonb', nullable: false, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  user_concurso_preferences: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    concurso_id: { type: 'uuid', nullable: false, default: null },
    can_change_until: { type: 'timestamp with time zone', nullable: false, default: null },
    selected_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    is_active: { type: 'boolean', nullable: true, default: 'true' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  user_discipline_stats: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    total_questions: { type: 'integer', nullable: true, default: '0' },
    correct_answers: { type: 'integer', nullable: true, default: '0' },
    average_score: { type: 'numeric', nullable: true, default: '0' },
    study_time_minutes: { type: 'integer', nullable: true, default: '0' },
    last_activity: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    disciplina: { type: 'character varying', nullable: false, default: null },
  },
  user_performance_cache: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: false, default: null },
    cache_key: { type: 'character varying', nullable: false, default: null },
    cache_data: { type: 'jsonb', nullable: false, default: null },
    expires_at: { type: 'timestamp with time zone', nullable: false, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  audit_logs: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    user_id: { type: 'uuid', nullable: true, default: null },
    action: { type: 'character varying', nullable: false, default: null },
    table_name: { type: 'character varying', nullable: false, default: null },
    record_id: { type: 'uuid', nullable: true, default: null },
    old_values: { type: 'jsonb', nullable: true, default: null },
    new_values: { type: 'jsonb', nullable: true, default: null },
    ip_address: { type: 'inet', nullable: true, default: null },
    user_agent: { type: 'text', nullable: true, default: null },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
  cache_config: {
    id: { type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    cache_key: { type: 'character varying', nullable: false, default: null },
    description: { type: 'text', nullable: true, default: null },
    ttl_minutes: { type: 'integer', nullable: false, default: '60' },
    created_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp with time zone', nullable: true, default: 'CURRENT_TIMESTAMP' },
  },
};

async function getActualSchema(supabase: SupabaseClient): Promise<TableInfo[]> {
  const { data, error } = await supabase.rpc('get_schema_info') as { data: TableColumn[], error: unknown };

  if (error) {
    throw new Error(`Erro ao buscar schema do banco: ${(error as { message?: string }).message ?? ''}`);
    return [];
  }

  const tables: { [key: string]: TableInfo } = {};
  for (const row of data) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = {
        table_name: row.table_name,
        columns: [],
      };
    }
    tables[row.table_name].columns.push({
      table_name: row.table_name,
      column_name: row.column_name,
      data_type: row.data_type,
      is_nullable: row.is_nullable,
      column_default: row.column_default,
    });
  }

  return Object.values(tables);
}

function normalizeDataType(type: string): string {
  // Normalizar tipos de dados para comparação
  const typeMap: { [key: string]: string } = {
    'character varying': 'varchar',
    'timestamp with time zone': 'timestamptz',
    'timestamp without time zone': 'timestamp',
    'double precision': 'float8',
    'bigint': 'int8',
    'integer': 'int4',
    'smallint': 'int2',
    'boolean': 'bool',
  };

  return typeMap[type.toLowerCase()] || type.toLowerCase();
}

function validateSchema(actualTables: TableInfo[]): SchemaValidationResult {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tables: {},
    summary: {
      totalTables: Object.keys(EXPECTED_SCHEMA).length,
      validTables: 0,
      totalColumns: 0,
      validColumns: 0,
      missingTables: [],
      missingColumns: [],
      typeConflicts: [],
    },
  };

  // Criar mapa das tabelas atuais
  const actualTablesMap = new Map<string, TableInfo>();
  actualTables.forEach(table => {
    actualTablesMap.set(table.table_name, table);
  });

  // Verificar cada tabela esperada
  Object.entries(EXPECTED_SCHEMA).forEach(([tableName, expectedColumns]) => {
    const actualTable = actualTablesMap.get(tableName);
    
    result.tables[tableName] = {
      exists: !!actualTable,
      columns: {},
    };

    if (!actualTable) {
      result.errors.push(`TABELA FALTANDO: A tabela '${tableName}' não existe no banco de dados`);
      result.summary.missingTables.push(tableName);
      result.isValid = false;
      return;
    }

    result.summary.validTables++;

    // Criar mapa das colunas atuais
    const actualColumnsMap = new Map<string, TableColumn>();
    actualTable.columns.forEach(column => {
      actualColumnsMap.set(column.column_name, column);
    });

    // Verificar cada coluna esperada
    Object.entries(expectedColumns).forEach(([columnName, expectedColumn]) => {
      result.summary.totalColumns++;
      
      const actualColumn = actualColumnsMap.get(columnName);
      
      result.tables[tableName].columns[columnName] = {
        exists: !!actualColumn,
        type: actualColumn?.data_type || 'MISSING',
        nullable: actualColumn?.is_nullable === 'YES',
        default: actualColumn?.column_default || null,
      };

      if (!actualColumn) {
        const errorMsg = `COLUNA FALTANDO: A coluna '${columnName}' não existe na tabela '${tableName}'`;
        result.errors.push(errorMsg);
        result.summary.missingColumns.push(`${tableName}.${columnName}`);
        result.isValid = false;
        return;
      }

      result.summary.validColumns++;

      // Verificar tipo de dados
      const expectedType = normalizeDataType(expectedColumn.type);
      const actualType = normalizeDataType(actualColumn.data_type);
      
      if (expectedType !== actualType) {
        const conflictMsg = `CONFLITO DE TIPO: ${tableName}.${columnName} - Esperado: ${expectedColumn.type}, Atual: ${actualColumn.data_type}`;
        result.warnings.push(conflictMsg);
        result.summary.typeConflicts.push(`${tableName}.${columnName}`);
      }

      // Verificar nullable
      const expectedNullable = expectedColumn.nullable;
      const actualNullable = actualColumn.is_nullable === 'YES';
      
      if (expectedNullable !== actualNullable) {
        const nullableMsg = `CONFLITO NULLABLE: ${tableName}.${columnName} - Esperado: ${expectedNullable ? 'NULL' : 'NOT NULL'}, Atual: ${actualNullable ? 'NULL' : 'NOT NULL'}`;
        result.warnings.push(nullableMsg);
      }
    });

    // Verificar colunas extras na tabela atual
    actualTable.columns.forEach(column => {
      if (!expectedColumns[column.column_name]) {
        result.warnings.push(`COLUNA EXTRA: A coluna '${column.column_name}' existe na tabela '${tableName}' mas não é esperada pelo código`);
      }
    });
  });

  // Verificar tabelas extras no banco
  actualTables.forEach(table => {
    if (!EXPECTED_SCHEMA[table.table_name]) {
      result.warnings.push(`TABELA EXTRA: A tabela '${table.table_name}' existe no banco mas não é usada pelo código`);
    }
  });

  return result;
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    
    logger.info('Iniciando verificação de schema do banco de dados');
    
    // Buscar schema atual do banco
    const actualTables = await getActualSchema(supabase);
    
    // Validar schema
    const validationResult = validateSchema(actualTables);
    
    // Log dos resultados
    if (validationResult.isValid) {
      logger.info('Schema do banco de dados está consistente', {
        validTables: validationResult.summary.validTables,
        validColumns: validationResult.summary.validColumns,
        warnings: validationResult.warnings.length,
      });
    } else {
      logger.error('Schema do banco de dados tem inconsistências', {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        missingTables: validationResult.summary.missingTables,
        missingColumns: validationResult.summary.missingColumns,
      });
    }

    return NextResponse.json({
      success: true,
      validation: validationResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Erro na verificação de schema', { error });
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SCHEMA_VALIDATION_ERROR', 
          message: 'Erro ao validar schema do banco de dados',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

