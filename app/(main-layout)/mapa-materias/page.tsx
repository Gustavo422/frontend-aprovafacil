"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';

import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Circle, 
  Map, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import { useConcursoMutation } from '@/src/hooks/useConcursoMutation';
import { useConcurso } from '@/contexts/ConcursoContext';

interface Assunto {
  id: string;
  tema: string;
  subtema: string | null;
  status: string;
}

interface MapaAssuntosData {
  assuntosPorDisciplina: Record<string, Assunto[]>;
}

export default function MapaAssuntosPage() {
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  const { activeConcursoId } = useConcurso();

  // Usar o hook customizado para buscar mapa de assuntos com filtro automático
  const {
    data: mapaData,
    isLoading,
    error,
    hasConcurso,
    isLoadingConcurso
  } = useConcursoQuery<MapaAssuntosData>({
    endpoint: '/api/mapa-assuntos',
    requireConcurso: true,
    fallbackData: { assuntosPorDisciplina: {} },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Usar o hook customizado para atualizar status
  const updateStatusMutation = useConcursoMutation({
    endpoint: '/api/mapa-assuntos/status',
    method: 'PUT',
    requireConcurso: true,
  });

  const assuntosPorDisciplina = mapaData?.assuntosPorDisciplina || {};

  // Loading state
  if (isLoading || isLoadingConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Erro ao buscar mapa de assuntos', {
      error: error instanceof Error ? error.message : String(error),
      concursoId: activeConcursoId,
    });
    
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar mapa de assuntos. Tente novamente.</p>
        </div>
      </div>
    );
  }

  // No concurso selected state
  if (!hasConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Map className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar o mapa de assuntos.
          </p>
        </div>
      </div>
    );
  }

  const updateStatus = async (assuntoId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ assuntoId, status });
      
      // O React Query irá invalidar e refazer a query automaticamente
      // devido ao cache invalidation configurado no hook
    } catch (err) {
      logger.error('Erro ao atualizar status', {
        error: err instanceof Error ? err.message : String(err),
        assuntoId,
        status,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'estudado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'a_revisar':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'nao_sei_nada':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'estudado':
        return <Badge className="bg-green-100 text-green-800">Estudado</Badge>;
      case 'a_revisar':
        return <Badge className="bg-yellow-100 text-yellow-800">A Revisar</Badge>;
      case 'nao_sei_nada':
        return <Badge className="bg-red-100 text-red-800">Não Sei Nada</Badge>;
      default:
        return <Badge variant="outline">Não Definido</Badge>;
    }
  };

  const disciplinas = Object.keys(assuntosPorDisciplina);

  if (disciplinas.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Map className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum assunto encontrado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Não há assuntos disponíveis para o concurso selecionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
      <p className="text-muted-foreground">
        Acompanhe seu progresso em cada disciplina e assunto.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedDisciplina || 'all'} onValueChange={(value) => setSelectedDisciplina(value === 'all' ? null : value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as disciplinas</SelectItem>
            {disciplinas.map((disciplina) => (
              <SelectItem key={disciplina} value={disciplina}>
                {disciplina}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {Object.entries(assuntosPorDisciplina)
          .filter(([disciplina]) => !selectedDisciplina || disciplina === selectedDisciplina)
          .map(([disciplina, assuntos]) => {
            const totalAssuntos = assuntos.length;
            const estudados = assuntos.filter(a => a.status === 'estudado').length;
            const progresso = (estudados / totalAssuntos) * 100;

            return (
              <Card key={disciplina}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{disciplina}</CardTitle>
                      <CardDescription>
                        {estudados} de {totalAssuntos} assuntos estudados (
                        {Math.round(progresso)}%)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(progresso)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {assuntos.map((assunto) => (
                      <div
                        key={assunto.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(assunto.status)}
                          <div>
                            <h4 className="font-medium">{assunto.tema}</h4>
                            {assunto.subtema && (
                              <p className="text-sm text-muted-foreground">
                                {assunto.subtema}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(assunto.status)}
                          <Select
                            value={assunto.status}
                            onValueChange={async (value) => updateStatus(assunto.id, value)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nao_sei_nada">Não Sei Nada</SelectItem>
                              <SelectItem value="a_revisar">A Revisar</SelectItem>
                              <SelectItem value="estudado">Estudado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {updateStatusMutation.isPending && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Atualizando status...</span>
        </div>
      )}
    </div>
  );
}
