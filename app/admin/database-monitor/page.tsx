'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  RefreshCw, 
  Info,
  XCircle,
  Activity,
  Download
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tables: {
    [tablenome: string]: {
      exists: boolean;
      columns: {
        [columnnome: string]: {
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

interface DatabaseUsageReport {
  tables: {
    [tablenome: string]: {
      usedInCode: boolean;
      usageLocations: string[];
      operations: string[];
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

// Interface para os resultados de benchmark
interface BenchmarkResult {
  tipo: string; // ex: 'SELECT simples', 'SELECT complexo', etc
  media: number;
  p95: number;
  p99: number;
  desvioPadrao: number;
  amostras: number[];
  timestamp: string;
}

function getBenchmarkClassificacao(media: number): 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' {
  if (media < 50) return 'Excelente';
  if (media < 100) return 'Bom';
  if (media < 200) return 'Atenção';
  return 'Crítico';
}

function getBenchmarkBadgeColor(classificacao: string) {
  switch (classificacao) {
    case 'Excelente': return 'bg-green-500 text-white';
    case 'Bom': return 'bg-blue-500 text-white';
    case 'Atenção': return 'bg-yellow-500 text-black';
    case 'Crítico': return 'bg-red-600 text-white';
    default: return 'bg-gray-300 text-black';
  }
}

function benchmarksToCSV(benchmarks: BenchmarkResult[]): string {
  const header = ['Tipo','Média (ms)','p95 (ms)','p99 (ms)','Desvio Padrão (ms)','Amostras','Timestamp','Classificação'];
  const rows = benchmarks.map(b => [
    b.tipo,
    b.media?.toFixed(2),
    b.p95?.toFixed(2),
    b.p99?.toFixed(2),
    b.desvioPadrao?.toFixed(2),
    b.amostras?.length,
    b.timestamp,
    getBenchmarkClassificacao(b.media)
  ]);
  return [header, ...rows].map(r => r.join(',')).join('\n');
}

export default function DatabaseMonitorPage() {
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult | null>(null);
  const [usageReport, setUsageReport] = useState<DatabaseUsageReport | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = useState(false);
  const [isRunningBenchmarks, setIsRunningBenchmarks] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, unknown> | null>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const validateSchema = useCallback(async () => {
    setIsLoadingSchema(true);
    try {
      const response = await fetch('/api/admin/validate-schema');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao validar schema');
      }

      setSchemaValidation(data.validation);
      
      if (data.validation.isValid) {
        toast({
          titulo: 'Schema válido',
          descricao: 'O schema do banco está consistente com o código.',
        });
      } else {
        toast({
          variant: 'destructive',
          titulo: 'Schema inválido',
          descricao: `${data.validation.errors.length} erros encontrados no schema.`,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        titulo: 'Erro na validação',
        descricao: 'Não foi possível validar o schema do banco.',
      });
    } finally {
      setIsLoadingSchema(false);
    }
  }, [toast]);

  const analyzeUsage = useCallback(async () => {
    setIsLoadingUsage(true);
    try {
      const response = await fetch('/api/admin/database-usage');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao analisar uso');
      }

      setUsageReport(data.report);
      
      toast({
        titulo: 'Análise concluída',
        descricao: 'Relatório de uso do banco gerado com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        titulo: 'Erro na análise',
        descricao: 'Não foi possível analisar o uso do banco.',
      });
    } finally {
      setIsLoadingUsage(false);
    }
  }, [toast]);

  const fetchBenchmarks = useCallback(async () => {
    setIsLoadingBenchmarks(true);
    try {
      const response = await fetch('/api/admin/benchmarks');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Erro ao buscar benchmarks');
      setBenchmarks(data.results || []);
    } catch {
      toast({
        variant: 'destructive',
        titulo: 'Erro ao buscar benchmarks',
        descricao: 'Não foi possível buscar os resultados dos benchmarks.',
      });
    } finally {
      setIsLoadingBenchmarks(false);
    }
  }, [toast]);

  const runBenchmarks = async () => {
    setIsRunningBenchmarks(true);
    setRunResults(null);
    try {
      const response = await fetch('/api/admin/benchmarks/run', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao rodar benchmarks');
      setRunResults(data.results);
      toast({ titulo: 'Benchmarks executados', descricao: 'Resultados atualizados com sucesso.' });
      fetchBenchmarks();
    } catch (err: unknown) {
      toast({ 
        variant: 'destructive', 
        titulo: 'Erro ao rodar benchmarks', 
        descricao: err instanceof Error ? err.message : String(err) 
      });
    } finally {
      setIsRunningBenchmarks(false);
    }
  };

  useEffect(() => {
    // Carregar dados iniciais
    validateSchema();
    analyzeUsage();
    fetchBenchmarks();
  }, [validateSchema, analyzeUsage, fetchBenchmarks]);

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return <XCircle className="h-4 w-4" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4" />;
      case 'LOW': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const csvData = useMemo(() => benchmarksToCSV(benchmarks), [benchmarks]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitor do Banco de Dados</h1>
          <p className="text-muted-foreground">
            Verificação de consistência e análise de uso do banco de dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={validateSchema} 
            disabled={isLoadingSchema}
            variant="outline"
          >
            {isLoadingSchema ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Validar Schema
          </Button>
          <Button 
            onClick={analyzeUsage} 
            disabled={isLoadingUsage}
            variant="outline"
          >
            {isLoadingUsage ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Analisar Uso
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schema">Validação de Schema</TabsTrigger>
          <TabsTrigger value="usage">Análise de Uso</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks de Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          {schemaValidation && (
            <>
              {/* Resumo da Validação */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
                    {schemaValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {schemaValidation.isValid ? 'Válido' : 'Inválido'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tabelas</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {schemaValidation.summary.validTables}/{schemaValidation.summary.totalTables}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tabelas válidas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Colunas</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {schemaValidation.summary.validColumns}/{schemaValidation.summary.totalColumns}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Colunas válidas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Problemas</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {schemaValidation.errors.length + schemaValidation.warnings.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erros e avisos
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Erros e Avisos */}
              {schemaValidation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Erros Críticos ({schemaValidation.errors.length}):</p>
                      <ul className="list-disc list-inside space-y-1">
                        {schemaValidation.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {schemaValidation.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Avisos ({schemaValidation.warnings.length}):</p>
                      <ul className="list-disc list-inside space-y-1">
                        {schemaValidation.warnings.slice(0, 10).map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                        {schemaValidation.warnings.length > 10 && (
                          <li className="text-sm text-muted-foreground">
                            ... e mais {schemaValidation.warnings.length - 10} avisos
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes das Tabelas */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes das Tabelas</CardTitle>
                  <CardDescription>
                    Status detalhado de cada tabela e suas colunas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(schemaValidation.tables).map(([tablenome, table]) => (
                      <div key={tablenome} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{tablenome}</h4>
                          <Badge variant={table.exists ? 'default' : 'destructive'}>
                            {table.exists ? 'Existe' : 'Faltando'}
                          </Badge>
                        </div>
                        {table.exists && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {Object.entries(table.columns).map(([columnnome, column]) => (
                              <div 
                                key={columnnome} 
                                className={`p-2 rounded border ${
                                  column.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="font-medium">{columnnome}</div>
                                <div className="text-xs text-muted-foreground">
                                  {column.type} {column.nullable ? '(NULL)' : '(NOT NULL)'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Botão de Exportação - Validação de Schema */}
              <div className="flex justify-end pt-4 border-t">
                <ExportJsonButton
                  data={{
                    schemaValidation,
                    exportType: 'schema-validation',
                    generatedAt: new Date().toISOString()
                  }}
                  filename="schema-validation-report"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usageReport && (
            <>
              {/* Resumo do Uso */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Tabelas</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.summary.totalTables}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tabelas Usadas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.summary.usedTables}</div>
                    <p className="text-xs text-muted-foreground">
                      {((usageReport.summary.usedTables / usageReport.summary.totalTables) * 100).toFixed(1)}% do total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tabelas Não Usadas</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.summary.unusedTables}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alto Risco</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.summary.highRiskOperations}</div>
                    <p className="text-xs text-muted-foreground">
                      Operações críticas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações Gerais */}
              {usageReport.summary.recommendations.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Recomendações Gerais:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {usageReport.summary.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes das Tabelas */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada por Tabela</CardTitle>
                  <CardDescription>
                    Uso, localização e recomendações para cada tabela
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usageReport.tables).map(([tablenome, table]) => (
                      <div key={tablenome} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{tablenome}</h4>
                          <div className="flex gap-2">
                            <Badge variant={table.usedInCode ? 'default' : 'secondary'}>
                              {table.usedInCode ? 'Usado' : 'Não usado'}
                            </Badge>
                            <Badge variant={getRiskBadgeVariant(table.riskLevel)}>
                              {getRiskIcon(table.riskLevel)}
                              {table.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        {table.usedInCode && (
                          <div className="space-y-2 mb-3">
                            <div>
                              <p className="text-sm font-medium">Operações:</p>
                              <div className="flex gap-1 mt-1">
                                {table.operations.map((op) => (
                                  <Badge key={op} variant="outline" className="text-xs">
                                    {op}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium">Localizações no código:</p>
                              <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                                {table.usageLocations.map((location, index) => (
                                  <li key={index}>{location}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {table.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Recomendações:</p>
                            <ul className="list-disc list-inside text-xs space-y-1">
                              {table.recommendations.map((rec, index) => (
                                <li
key={index} className={
                                  rec.includes('CRÍTICO') ? 'text-red-600' : 
                                  rec.includes('CONFLITO') ? 'text-yellow-600' : 
                                  'text-muted-foreground'
                                }
                                >
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Botão de Exportação - Análise de Uso */}
              <div className="flex justify-end pt-4 border-t">
                <ExportJsonButton
                  data={{
                    usageReport,
                    exportType: 'database-usage-analysis',
                    generatedAt: new Date().toISOString()
                  }}
                  filename="database-usage-report"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Benchmarks de Performance</h2>
            <div className="flex gap-2">
              <Button
                ref={runButtonRef}
                onClick={runBenchmarks}
                disabled={isRunningBenchmarks}
                variant="default"
              >
                {isRunningBenchmarks ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Rodar Benchmarks
              </Button>
              <Button
                onClick={fetchBenchmarks}
                disabled={isLoadingBenchmarks || isRunningBenchmarks}
                variant="outline"
              >
                {isLoadingBenchmarks ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Atualizar
              </Button>
              <ExportJsonButton
                data={{ results: benchmarks, exportType: 'benchmarks', generatedAt: new Date().toISOString() }}
                filename={`benchmarks_${new Date().toISOString()}.json`}
              />
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
                download={`benchmarks_${new Date().toISOString()}.csv`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ marginLeft: 8 }}
              >
                Exportar CSV
              </a>
            </div>
          </div>
          {isRunningBenchmarks && (
            <Alert>
              <AlertDescription>Executando benchmarks... Aguarde.</AlertDescription>
            </Alert>
          )}
          {runResults && Array.isArray(runResults) && (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>
                  Benchmarks executados! Veja os resultados abaixo.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runResults.map((b: BenchmarkResult, idx: number) => {
                  const classificacao = getBenchmarkClassificacao(b.media);
                  return (
                    <Card key={idx}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{b.tipo}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getBenchmarkBadgeColor(classificacao)}`}>{classificacao}</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">Média: <b>{b.media.toFixed(2)} ms</b></div>
                        <div className="text-xs text-muted-foreground">p95: {b.p95.toFixed(2)} ms | p99: {b.p99.toFixed(2)} ms</div>
                        <div className="text-xs text-muted-foreground">Desvio padrão: {b.desvioPadrao.toFixed(2)} ms</div>
                        <div className="text-xs text-muted-foreground">Amostras: {b.amostras.length}</div>
                        <div className="text-xs text-muted-foreground">Executado em: {b.timestamp ? new Date(b.timestamp).toLocaleString() : '-'}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {benchmarks.length === 0 ? (
            <Alert>
              <AlertDescription>Nenhum resultado de benchmark encontrado.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benchmarks.map((b, idx) => {
                const classificacao = getBenchmarkClassificacao(b.media);
                return (
                  <Card key={idx}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{b.tipo}</CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getBenchmarkBadgeColor(classificacao)}`}>{classificacao}</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">Média: <b>{b.media.toFixed(2)} ms</b></div>
                      <div className="text-xs text-muted-foreground">p95: {b.p95.toFixed(2)} ms | p99: {b.p99.toFixed(2)} ms</div>
                      <div className="text-xs text-muted-foreground">Desvio padrão: {b.desvioPadrao.toFixed(2)} ms</div>
                      <div className="text-xs text-muted-foreground">Amostras: {b.amostras.length}</div>
                      <div className="text-xs text-muted-foreground">Executado em: {new Date(b.timestamp).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}