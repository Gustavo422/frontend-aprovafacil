'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  Activity
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

interface DatabaseUsageReport {
  tables: {
    [tableName: string]: {
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

export default function DatabaseUsagePage() {
  const [usageReport, setUsageReport] = useState<DatabaseUsageReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzeUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/database-usage');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao analisar uso');
      }

      setUsageReport(data.report);
      
      toast({
        title: 'Análise concluída',
        description: 'Relatório de uso do banco gerado com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro na análise',
        description: 'Não foi possível analisar o uso do banco.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    analyzeUsage();
  }, [analyzeUsage]);

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

  const getUsageData = () => {
    return {
      usageReport,
      exportInfo: {
        timestamp: new Date().toISOString(),
        exportType: 'database-usage-analysis',
        version: '1.0'
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análise de Uso do Banco</h1>
          <p className="text-muted-foreground">
            Analise o uso das tabelas e identifique oportunidades de otimização
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={analyzeUsage} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Analisar Uso
          </Button>
        </div>
      </div>

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

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="tables">Análise por Tabela</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
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

              {/* Estatísticas de Uso */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Uso</CardTitle>
                  <CardDescription>
                    Resumo do uso das tabelas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Distribuição de Uso</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tabelas utilizadas</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(usageReport.summary.usedTables / usageReport.summary.totalTables) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{usageReport.summary.usedTables}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tabelas não utilizadas</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-600 h-2 rounded-full" 
                                style={{ width: `${(usageReport.summary.unusedTables / usageReport.summary.totalTables) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{usageReport.summary.unusedTables}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Níveis de Risco</h4>
                      <div className="space-y-2">
                        {Object.entries(
                          Object.entries(usageReport.tables).reduce((acc, [_tableName, table]) => {
                            acc[table.riskLevel] = (acc[table.riskLevel] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([riskLevel, count]) => (
                          <div key={riskLevel} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {getRiskIcon(riskLevel)}
                              <span className="text-sm capitalize">{riskLevel.toLowerCase()}</span>
                            </div>
                            <Badge variant={getRiskBadgeVariant(riskLevel)}>{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada por Tabela</CardTitle>
                  <CardDescription>
                    Uso, localização e recomendações para cada tabela
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usageReport.tables).map(([tableName, table]) => (
                      <div key={tableName} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{tableName}</h4>
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
                                <li key={index} className={
                                  rec.includes('CRÍTICO') ? 'text-red-600' : 
                                  rec.includes('CONFLITO') ? 'text-yellow-600' : 
                                  'text-muted-foreground'
                                }>
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
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recomendações de Otimização</CardTitle>
                  <CardDescription>
                    Sugestões para melhorar o uso e performance do banco de dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tabelas não utilizadas */}
                  {usageReport.summary.unusedTables > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Tabelas Não Utilizadas ({usageReport.summary.unusedTables})</p>
                          <p className="text-sm">
                            Considere remover tabelas não utilizadas para simplificar o schema e melhorar a manutenibilidade.
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Tabelas: {Object.entries(usageReport.tables)
                              .filter(([_, table]) => !table.usedInCode)
                              .map(([tableName, _]) => tableName)
                              .join(', ')}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Operações de alto risco */}
                  {usageReport.summary.highRiskOperations > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Operações de Alto Risco ({usageReport.summary.highRiskOperations})</p>
                          <p className="text-sm">
                            Revise operações que podem causar problemas de performance ou integridade de dados.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Recomendações específicas */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Recomendações Específicas:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {usageReport.summary.recommendations.map((rec, index) => (
                        <li key={index} className="p-2 bg-muted rounded">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botão de Exportação */}
          <div className="flex justify-end pt-4 border-t">
            <ExportJsonButton
              data={getUsageData()}
              filename="database-usage-report"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            />
          </div>
        </>
      )}

      {/* Estado de carregamento */}
      {isLoading && !usageReport && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <h2 className="text-xl font-semibold">Analisando Uso do Banco</h2>
          <p className="text-muted-foreground">Verificando uso das tabelas e gerando relatório...</p>
        </div>
      )}
    </div>
  );
} 