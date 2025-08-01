'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileCheck, Clock, Target, Users, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

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
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulados();
  }, []);

  const fetchSimulados = async () => {
    try {
      const response = await fetch('/api/simulados?ativo=true');
      const data = await response.json();
      
      if (response.ok && data.data) {
        setSimulados(data.data);
      } else {
        setSimulados([]);
        if (!response.ok) {
          logger.error('Erro ao buscar simulados', {
            status: response.status,
            data: data
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao buscar simulados', {
        error: error instanceof Error ? error.message : String(error),
      });
      setSimulados([]);
    } finally {
      setLoading(false);
    }
  };

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'dificil':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">Carregando simulados...</p>
      </div>
    );
  }

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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{simulado.numero_questoes} questões</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{simulado.tempo_limite_minutos} min</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>0 tentativas</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Não iniciado</span>
                </div>
              </div>

              <Link href={`/simulados/${simulado.id}`} className="w-full">
                <Button className="w-full">Iniciar Simulado</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {simulados.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum simulado disponível</CardTitle>
            <CardDescription>
              Os simulados serão adicionados em breve. Fique atento às atualizações!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Enquanto isso, você pode estudar com as apostilas e questões semanais.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 