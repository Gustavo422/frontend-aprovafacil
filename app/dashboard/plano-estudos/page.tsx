'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Clock, TrendingUp } from 'lucide-react';

interface PlanoEstudo {
  id: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  progresso: number;
  disciplinas: string[];
  meta_diaria: number;
  tempo_estimado: number;
}

export default function PlanoEstudosPage() {
  const [planoEstudo, setPlanoEstudo] = useState<PlanoEstudo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanoEstudo();
  }, []);

  const fetchPlanoEstudo = async () => {
    try {
      const response = await fetch('/api/plano-estudos');
      const data = await response.json();

      if (data.hasActivePlan) {
        setPlanoEstudo(data.planoEstudo);
      }
    } catch (error) {
      logger.error('Erro ao buscar plano de estudos', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Plano de Estudos</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!planoEstudo) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Plano de Estudos</h1>
        <p className="text-muted-foreground">
          Crie seu plano de estudos personalizado.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Nenhum plano ativo</CardTitle>
            <CardDescription>
              Você ainda não tem um plano de estudos. Crie um para começar a
              estudar de forma organizada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Criar Plano de Estudos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(planoEstudo.data_inicio);
  const endDate = new Date(planoEstudo.data_fim);
  const today = new Date();
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progress = Math.min((daysElapsed / totalDays) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Plano de Estudos</h1>
      <p className="text-muted-foreground">
        Acompanhe seu progresso no plano de estudos.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progresso Geral
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <p className="text-xs text-muted-foreground">
              {daysElapsed} de {totalDays} dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dias Restantes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(totalDays - daysElapsed, 0)}
            </div>
            <p className="text-xs text-muted-foreground">dias para concluir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas por Dia</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">média diária</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assuntos Estudados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">de 35 assuntos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Estudos</CardTitle>
          <CardDescription>
            Seu cronograma personalizado de {startDate.toLocaleDateString()} a{' '}
            {endDate.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Cronograma em desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">
                  O cronograma detalhado será implementado em breve
                </p>
              </div>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
