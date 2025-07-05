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
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

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

export default function ValidateSchemaPage() {
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateSchema = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/validate-schema');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao validar schema');
      }

      setSchemaValidation(data.validation);
      
      if (data.validation.isValid) {
        toast({
          title: 'Schema válido',
          description: 'O schema do banco está consistente com o código.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Schema inválido',
          description: `${data.validation.errors.length} erros encontrados no schema.`,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro na validação',
        description: 'Não foi possível validar o schema do banco.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    validateSchema();
  }, [validateSchema]);

  const getSchemaData = () => {
    return {
      schemaValidation,
      exportInfo: {
        timestamp: new Date().toISOString(),
        exportType: 'schema-validation',
        version: '1.0'
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validação de Schema</h1>
          <p className="text-muted-foreground">
            Verifique a consistência entre o schema do banco e o código da aplicação
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={validateSchema} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Validar Schema
          </Button>
        </div>
      </div>

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
                <FileText className="h-4 w-4 text-muted-foreground" />
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

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="tables">Tabelas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Erros Críticos */}
              {schemaValidation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
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

              {/* Avisos */}
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

              {/* Resumo de Problemas */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Problemas</CardTitle>
                  <CardDescription>
                    Detalhes dos problemas encontrados na validação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Tabelas Faltando</h4>
                      <div className="text-xs text-muted-foreground">
                        {schemaValidation.summary.missingTables.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {schemaValidation.summary.missingTables.map((table, index) => (
                              <li key={index}>{table}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-green-600">Nenhuma tabela faltando</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Colunas Faltando</h4>
                      <div className="text-xs text-muted-foreground">
                        {schemaValidation.summary.missingColumns.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {schemaValidation.summary.missingColumns.slice(0, 5).map((column, index) => (
                              <li key={index}>{column}</li>
                            ))}
                            {schemaValidation.summary.missingColumns.length > 5 && (
                              <li>... e mais {schemaValidation.summary.missingColumns.length - 5}</li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-green-600">Nenhuma coluna faltando</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Conflitos de Tipo</h4>
                      <div className="text-xs text-muted-foreground">
                        {schemaValidation.summary.typeConflicts.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {schemaValidation.summary.typeConflicts.slice(0, 5).map((conflict, index) => (
                              <li key={index}>{conflict}</li>
                            ))}
                            {schemaValidation.summary.typeConflicts.length > 5 && (
                              <li>... e mais {schemaValidation.summary.typeConflicts.length - 5}</li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-green-600">Nenhum conflito de tipo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Validação</CardTitle>
                  <CardDescription>
                    Informações técnicas sobre a validação realizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Estatísticas Gerais</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total de tabelas verificadas:</span>
                          <span className="font-medium">{schemaValidation.summary.totalTables}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tabelas válidas:</span>
                          <span className="font-medium text-green-600">{schemaValidation.summary.validTables}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de colunas verificadas:</span>
                          <span className="font-medium">{schemaValidation.summary.totalColumns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Colunas válidas:</span>
                          <span className="font-medium text-green-600">{schemaValidation.summary.validColumns}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Problemas Encontrados</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Erros críticos:</span>
                          <span className="font-medium text-red-600">{schemaValidation.errors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avisos:</span>
                          <span className="font-medium text-yellow-600">{schemaValidation.warnings.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tabelas faltando:</span>
                          <span className="font-medium text-red-600">{schemaValidation.summary.missingTables.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Colunas faltando:</span>
                          <span className="font-medium text-red-600">{schemaValidation.summary.missingColumns.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes das Tabelas</CardTitle>
                  <CardDescription>
                    Status detalhado de cada tabela e suas colunas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(schemaValidation.tables).map(([tableName, table]) => (
                      <div key={tableName} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{tableName}</h4>
                          <Badge variant={table.exists ? 'default' : 'destructive'}>
                            {table.exists ? 'Existe' : 'Faltando'}
                          </Badge>
                        </div>
                        {table.exists && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {Object.entries(table.columns).map(([columnName, column]) => (
                              <div 
                                key={columnName} 
                                className={`p-2 rounded border ${
                                  column.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="font-medium">{columnName}</div>
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
            </TabsContent>
          </Tabs>

          {/* Botão de Exportação */}
          <div className="flex justify-end pt-4 border-t">
            <ExportJsonButton
              data={getSchemaData()}
              filename="schema-validation-report"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            />
          </div>
        </>
      )}

      {/* Estado de carregamento */}
      {isLoading && !schemaValidation && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold">Validando Schema</h2>
          <p className="text-muted-foreground">Verificando consistência do banco de dados...</p>
        </div>
      )}
    </div>
  );
} 