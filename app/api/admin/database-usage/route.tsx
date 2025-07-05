import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';

interface DatabaseUsageReport {
  tables: {
    [tableName: string]: {
      usedInCode: boolean;
      usageLocations: string[];
      operations: string[];
      lastAccessed?: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      recommendations: string[];
    };
  };
  summary: {
    totalTables: number;
    usedTables: number;
    unusedTables: number;
    highRiskOperations: number;
    recommendations: string[];
  };
}

// Mapeamento de onde cada tabela é usada no código
const TABLE_USAGE_MAP = {
  users: {
    locations: [
      'app/register/page.tsx',
      'app/api/auth/login/route.ts',
      'lib/database.types.ts',
      'src/features/auth/hooks/use-auth.ts',
    ],
    operations: ['INSERT', 'SELECT', 'UPDATE'],
    riskLevel: 'HIGH' as const,
  },
  concurso_categorias: {
    locations: [
      'lib/database.types.ts',
      'src/core/database/repositories/simulados-repository.ts',
      'src/features/simulados/services/simulados-service.ts',
    ],
    operations: ['SELECT'],
    riskLevel: 'MEDIUM' as const,
  },
  categoria_disciplinas: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT'],
    riskLevel: 'LOW' as const,
  },
  concursos: {
    locations: [
      'lib/database.types.ts',
      'src/core/database/repositories/simulados-repository.ts',
      'src/features/simulados/services/simulados-service.ts',
    ],
    operations: ['SELECT'],
    riskLevel: 'MEDIUM' as const,
  },
  simulados: {
    locations: [
      'lib/database.types.ts',
      'src/core/database/repositories/simulados-repository.ts',
      'src/features/simulados/services/simulados-service.ts',
      'app/api/simulados/route.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'HIGH' as const,
  },
  simulado_questions: {
    locations: [
      'lib/database.types.ts',
      'src/core/database/repositories/simulados-repository.ts',
      'src/features/simulados/services/simulados-service.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'HIGH' as const,
  },
  user_simulado_progress: {
    locations: [
      'lib/database.types.ts',
      'src/core/database/repositories/simulados-repository.ts',
      'src/features/simulados/services/simulados-service.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'HIGH' as const,
  },
  flashcards: {
    locations: [
      'lib/database.types.ts',
      'src/features/flashcards/services/flashcards-service.ts',
      'app/api/flashcards/route.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'MEDIUM' as const,
  },
  user_flashcard_progress: {
    locations: [
      'lib/database.types.ts',
      'src/features/flashcards/services/flashcards-service.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'MEDIUM' as const,
  },
  apostilas: {
    locations: [
      'lib/database.types.ts',
      'src/features/apostilas/services/apostilas-service.ts',
      'app/api/apostilas/route.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'MEDIUM' as const,
  },
  apostila_content: {
    locations: [
      'lib/database.types.ts',
      'src/features/apostilas/services/apostilas-service.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'MEDIUM' as const,
  },
  user_apostila_progress: {
    locations: [
      'lib/database.types.ts',
      'src/features/apostilas/services/apostilas-service.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'MEDIUM' as const,
  },
  questoes_semanais: {
    locations: [
      'lib/database.types.ts',
      'app/api/questoes-semanais/route.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'MEDIUM' as const,
  },
  user_questoes_semanais_progress: {
    locations: [
      'lib/database.types.ts',
      'app/api/questoes-semanais/route.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'MEDIUM' as const,
  },
  mapa_assuntos: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT'],
    riskLevel: 'LOW' as const,
  },
  user_mapa_assuntos_status: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'LOW' as const,
  },
  planos_estudo: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'LOW' as const,
  },
  user_concurso_preferences: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'MEDIUM' as const,
  },
  user_discipline_stats: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'LOW' as const,
  },
  user_performance_cache: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    riskLevel: 'LOW' as const,
  },
  cache_config: {
    locations: [
      'lib/database.types.ts',
    ],
    operations: ['SELECT', 'INSERT', 'UPDATE'],
    riskLevel: 'LOW' as const,
  },
  audit_logs: {
    locations: [
      'lib/database.types.ts',
      'lib/audit-logger.ts',
    ],
    operations: ['INSERT', 'SELECT'],
    riskLevel: 'LOW' as const,
  },
};

type TableUsage = typeof TABLE_USAGE_MAP[keyof typeof TABLE_USAGE_MAP];

async function getActualTables(supabase: SupabaseClient): Promise<string[]> {
  try {
    // Lista de tabelas esperadas baseada no TABLE_USAGE_MAP
    const expectedTables = Object.keys(TABLE_USAGE_MAP);
    const actualTables: string[] = [];

    // Verificar cada tabela esperada
    for (const tableName of expectedTables) {
      try {
        // Tentar fazer uma consulta simples para verificar se a tabela existe
  const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

  if (error) {
          // Se a tabela não existe, pular
          continue;
        }

        // Se chegou aqui, a tabela existe
        actualTables.push(tableName);
      } catch {
        // Ignorar erros de tabelas que não existem
        continue;
      }
    }

    return actualTables;
  } catch (error) {
    throw new Error(`Erro ao buscar tabelas do banco: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateRecommendations(tableName: string, usage: TableUsage | undefined, exists: boolean): string[] {
  const recommendations: string[] = [];

  if (!exists) {
    recommendations.push(`CRÍTICO: Tabela '${tableName}' não existe no banco mas é usada no código`);
    recommendations.push(`Criar tabela '${tableName}' ou remover referências do código`);
    return recommendations;
  }

  if (!usage) {
    recommendations.push(`Tabela '${tableName}' existe no banco mas não é usada no código`);
    recommendations.push(`Considerar remover a tabela se não for necessária`);
    return recommendations;
  }

  if (usage.riskLevel === 'HIGH') {
    recommendations.push(`Tabela crítica: implementar backup e monitoramento`);
    recommendations.push(`Implementar validação rigorosa antes de operações de escrita`);
  }

  if (usage.operations.includes('DELETE')) {
    recommendations.push(`Implementar soft delete para preservar dados históricos`);
  }

  if (usage.operations.includes('UPDATE')) {
    recommendations.push(`Implementar auditoria para rastrear mudanças`);
  }

  return recommendations;
}

function generateDatabaseUsageReport(actualTables: string[]): DatabaseUsageReport {
  const report: DatabaseUsageReport = {
    tables: {},
    summary: {
      totalTables: actualTables.length,
      usedTables: 0,
      unusedTables: 0,
      highRiskOperations: 0,
      recommendations: [],
    },
  };

  // Verificar tabelas que existem no banco
  actualTables.forEach(tableName => {
    const usage = TABLE_USAGE_MAP[tableName as keyof typeof TABLE_USAGE_MAP];
    const isUsed = !!usage;

    if (isUsed) {
      report.summary.usedTables++;
    } else {
      report.summary.unusedTables++;
    }

    if (usage?.riskLevel === 'HIGH') {
      report.summary.highRiskOperations++;
    }

    report.tables[tableName] = {
      usedInCode: isUsed,
      usageLocations: usage?.locations || [],
      operations: usage?.operations || [],
      riskLevel: usage?.riskLevel || 'LOW',
      recommendations: generateRecommendations(tableName, usage, true),
    };
  });

  // Verificar tabelas que são usadas no código mas não existem no banco
  Object.entries(TABLE_USAGE_MAP).forEach(([tableName, usage]) => {
    if (!actualTables.includes(tableName)) {
      report.tables[tableName] = {
        usedInCode: true,
        usageLocations: usage.locations,
        operations: usage.operations,
        riskLevel: 'HIGH', // Sempre alto risco se não existe
        recommendations: generateRecommendations(tableName, usage, false),
      };
      report.summary.highRiskOperations++;
    }
  });

  // Gerar recomendações gerais
  if (report.summary.unusedTables > 0) {
    report.summary.recommendations.push(
      `${report.summary.unusedTables} tabelas não são usadas pelo código e podem ser removidas`
    );
  }

  if (report.summary.highRiskOperations > 0) {
    report.summary.recommendations.push(
      `${report.summary.highRiskOperations} operações de alto risco requerem atenção especial`
    );
  }

  const usageRate = (report.summary.usedTables / report.summary.totalTables) * 100;
  if (usageRate < 80) {
    report.summary.recommendations.push(
      `Taxa de uso das tabelas é baixa (${usageRate.toFixed(1)}%). Considere limpeza do banco`
    );
  }

  return report;
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    
    logger.info('Iniciando análise de uso do banco de dados');
    
    // Buscar tabelas atuais do banco
    const actualTables = await getActualTables(supabase);
    
    // Gerar relatório de uso
    const usageReport = generateDatabaseUsageReport(actualTables);
    
    // Log dos resultados
    logger.info('Análise de uso do banco concluída', {
      totalTables: usageReport.summary.totalTables,
      usedTables: usageReport.summary.usedTables,
      unusedTables: usageReport.summary.unusedTables,
      highRiskOperations: usageReport.summary.highRiskOperations,
    });

    return NextResponse.json({
      success: true,
      report: usageReport,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Erro na análise de uso do banco', { error });
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'DATABASE_USAGE_ANALYSIS_ERROR', 
          message: 'Erro ao analisar uso do banco de dados',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

