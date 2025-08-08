'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileCheck, Clock, Target, Users, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import { useConcurso } from '@/contexts/ConcursoContext';

interface Simulado {
  id: string;
  titulo: string;
  descricao: string;
  numero_questoes: number;
  tempo_limite_minutos: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  concurso_id: string | null;
  ativo: boolean;
  criado_em: string;
  concurso?: {
    nome: string;
    ano: number;
    banca: string;
  };
}

export default function SimuladosPage() {
  const { activeConcursoId } = useConcurso();

  // Usar o hook customizado para buscar simulados com filtro automático
  const {
    data: simulados = [],
    isLoading,
    error,
    hasConcurso,
    isLoadingConcurso
  } = useConcursoQuery<Simulado[]>({
    endpoint: '/api/simulados',
    requireConcurso: true,
    fallbackData: [],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Loading state
  if (isLoading || isLoadingConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Erro ao buscar simulados', {
      error: error instanceof Error ? error.message : String(error),
      concursoId: activeConcursoId,
    });
    
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar simulados. Tente novamente.</p>
        </div>
      </div>
    );
  }

  // No concurso selected state
  if (!hasConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar os simulados disponíveis.
          </p>
        </div>
      </div>
    );
  }

  const getDificuldadeColor = (dificuldade: string) => {
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
  };

  const getDificuldadeText = (dificuldade: string) => {
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
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
          <p className="text-muted-foreground">
            Teste seus conhecimentos com simulados específicos para seu concurso.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {simulados && simulados.map(simulado => (
          <Card key={simulado.id} className="h-full hover:shadow-lg transition-shadow">
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
                    {simulado.concurso && (
                      <Badge variant="outline">
                        {simulado.concurso.nome}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription>{simulado.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{simulado.numero_questoes} questões</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{simulado.tempo_limite_minutos} min</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>0 participantes</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criado em {new Date(simulado.criado_em).toLocaleDateString()}</span>
              </div>

              <Link href={`/simulados/${simulado.id}`} className="w-full">
                <Button className="w-full">Iniciar Simulado</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {simulados.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum simulado encontrado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Não há simulados disponíveis para o concurso selecionado.
          </p>
        </div>
      )}
    </div>
  );
} 