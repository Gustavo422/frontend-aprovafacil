"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Clock, Users, Calendar, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { simuladosKeys } from '@/src/providers/query-client';
import { getSimuladoBySlug, getQuestoesBySlug } from '../api/fetchers';
import type { Simulado } from '../api/contracts';

type Props = {
  simulado: Simulado;
};

function getDificuldadeColor(dificuldade: string) {
  switch (dificuldade) {
    case 'facil':
      return 'bg-green-100 text-green-800';
    case 'medio':
      return 'bg-yellow-100 text-yellow-800';
    case 'dificil':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getDificuldadeText(dificuldade: string) {
  switch (dificuldade) {
    case 'facil':
      return 'Fácil';
    case 'medio':
      return 'Médio';
    case 'dificil':
      return 'Difícil';
    default:
      return 'Não definido';
  }
}

export function SimuladoCard({ simulado }: Props) {
  const queryClient = useQueryClient();

  const prefetch = async () => {
    if (!simulado.slug) return;
    // Prefetch detalhe e questões para transição suave
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: simuladosKeys.detail(simulado.slug),
        queryFn: () => getSimuladoBySlug(simulado.slug),
        staleTime: 30_000,
      }),
      queryClient.prefetchQuery({
        queryKey: simuladosKeys.questoes(simulado.slug),
        queryFn: () => getQuestoesBySlug(simulado.slug),
        staleTime: 30_000,
      }),
    ]);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {simulado.titulo}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={getDificuldadeColor(simulado.dificuldade)}>
                {getDificuldadeText(simulado.dificuldade)}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription>{simulado.descricao || ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>{simulado.numero_questoes} questões</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{simulado.tempo_minutos} min</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>— participantes</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Criado em {new Date(simulado.criado_em).toLocaleDateString()}</span>
        </div>

        <Link href={`/simulados/${simulado.slug}`} className="w-full" onMouseEnter={prefetch} onFocus={prefetch}>
          <Button className="w-full" onMouseEnter={prefetch} onFocus={prefetch}>Iniciar Simulado</Button>
        </Link>
      </CardContent>
    </Card>
  );
}


