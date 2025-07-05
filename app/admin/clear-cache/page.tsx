'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Settings, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

interface CacheStats {
  performanceCache: number;
  configCache: number;
  disciplineStats: number;
}

interface ClearCacheResult {
  success: boolean;
  message: string;
  details: {
    performanceCache: boolean;
    configCache: boolean;
    disciplineStats: boolean;
  };
}

export default function ClearCachePage() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [clearResult, setClearResult] = useState<ClearCacheResult | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const fetchCacheStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/admin/clear-cache');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao buscar estatísticas do cache');
      }

      setCacheStats(data.cacheStats);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar estatísticas',
        description: 'Não foi possível carregar as estatísticas do cache.',
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  const clearCache = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao limpar cache');
      }

      setClearResult(data);
      
      // Recarregar estatísticas após limpeza
      await fetchCacheStats();
      
      toast({
        title: 'Cache limpo com sucesso',
        description: 'Todos os caches foram limpos com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao limpar cache',
        description: 'Não foi possível limpar o cache do sistema.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  const getTotalCacheItems = () => {
    if (!cacheStats) return 0;
    return cacheStats.performanceCache + cacheStats.configCache + cacheStats.disciplineStats;
  };

  const getCacheData = () => {
    return {
      cacheStats,
      clearResult,
      exportInfo: {
        timestamp: new Date().toISOString(),
        exportType: 'cache-management',
        version: '1.0'
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Cache</h1>
          <p className="text-muted-foreground">
            Visualize e limpe os caches do sistema para otimizar performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchCacheStats} 
            disabled={isLoadingStats}
            variant="outline"
          >
            {isLoadingStats ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button 
            onClick={clearCache} 
            disabled={isClearing || getTotalCacheItems() === 0}
            variant="destructive"
          >
            {isClearing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Limpar Cache
          </Button>
        </div>
      </div>

      {/* Estatísticas do Cache */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCacheItems()}</div>
            <p className="text-xs text-muted-foreground">
              Itens em cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache de Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.performanceCache || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dados de performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache de Configuração</CardTitle>
            <Settings className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.configCache || 0}</div>
            <p className="text-xs text-muted-foreground">
              Configurações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estatísticas de Disciplina</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.disciplineStats || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dados por disciplina
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status da Última Limpeza */}
      {clearResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Última limpeza realizada com sucesso!</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={clearResult.details.performanceCache ? 'default' : 'destructive'}>
                    {clearResult.details.performanceCache ? '✅' : '❌'} Performance
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={clearResult.details.configCache ? 'default' : 'destructive'}>
                    {clearResult.details.configCache ? '✅' : '❌'} Configuração
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={clearResult.details.disciplineStats ? 'default' : 'destructive'}>
                    {clearResult.details.disciplineStats ? '✅' : '❌'} Disciplinas
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Informações sobre Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre o Cache do Sistema
          </CardTitle>
          <CardDescription>
            Entenda como funciona o sistema de cache e quando limpá-lo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Cache de Performance</h4>
              <p className="text-xs text-muted-foreground">
                Armazena dados de performance dos usuários para otimizar consultas frequentes.
                Limpe quando houver problemas de performance.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Cache de Configuração</h4>
              <p className="text-xs text-muted-foreground">
                Configurações do sistema e parâmetros de cache. Limpe quando alterar configurações.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Estatísticas de Disciplina</h4>
              <p className="text-xs text-muted-foreground">
                Dados de performance por disciplina. Limpe para recalcular estatísticas.
              </p>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A limpeza do cache pode afetar temporariamente a performance 
              do sistema até que os dados sejam recalculados. Execute apenas quando necessário.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Botão de Exportação */}
      <div className="flex justify-end pt-4 border-t">
        <ExportJsonButton
          data={getCacheData()}
          filename="cache-management-report"
          variant="default"
          className="bg-red-600 hover:bg-red-700"
        />
      </div>
    </div>
  );
}