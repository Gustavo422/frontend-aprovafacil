'use client';
import { logger } from '@/lib/logger';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Circle } from 'lucide-react';

import { useState, useEffect } from 'react';

interface Assunto {
  id: string;
  disciplina: string;
  tema: string;
  subtema: string | null;
  status: string;
}

export default function MapaAssuntosPage() {
  const [assuntosPorDisciplina, setAssuntosPorDisciplina] = useState<
    Record<string, Assunto[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapaAssuntos();
  }, []);

  const fetchMapaAssuntos = async () => {
    try {
      const response = await fetch('/api/mapa-assuntos');
      const data = await response.json();
      setAssuntosPorDisciplina(data.assuntosPorDisciplina);
    } catch (error) {
      logger.error('Erro ao buscar mapa de assuntos', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (assuntoId: string, status: string) => {
    try {
      await fetch('/api/mapa-assuntos/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assuntoId, status }),
      });

      // Atualizar o estado local
      setAssuntosPorDisciplina(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(disciplina => {
          newState[disciplina] = newState[disciplina].map(assunto =>
            assunto.id === assuntoId ? { ...assunto, status } : assunto
          );
        });
        return newState;
      });
    } catch (error) {
      logger.error('Erro ao atualizar status', {
        error: error instanceof Error ? error.message : String(error),
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
        return (
          <Badge variant="default" className="bg-green-500">
            Estudado
          </Badge>
        );
      case 'a_revisar':
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            A Revisar
          </Badge>
        );
      case 'nao_sei_nada':
        return <Badge variant="destructive">Não Sei Nada</Badge>;
      default:
        return <Badge variant="outline">Não Estudado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Mapa de Assuntos</h1>
      <p className="text-muted-foreground">
        Acompanhe seu progresso em cada disciplina e assunto.
      </p>

      <div className="grid gap-6">
        {Object.entries(assuntosPorDisciplina).map(([disciplina, assuntos]) => {
          const totalAssuntos = assuntos.length;
          const estudados = assuntos.filter(
            a => a.status === 'estudado'
          ).length;
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
                  {assuntos.map(assunto => (
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
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(assunto.id, 'estudado')}
                            className={
                              assunto.status === 'estudado' ? 'bg-green-50' : ''
                            }
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus(assunto.id, 'a_revisar')
                            }
                            className={
                              assunto.status === 'a_revisar'
                                ? 'bg-yellow-50'
                                : ''
                            }
                          >
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus(assunto.id, 'nao_sei_nada')
                            }
                            className={
                              assunto.status === 'nao_sei_nada'
                                ? 'bg-red-50'
                                : ''
                            }
                          >
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
