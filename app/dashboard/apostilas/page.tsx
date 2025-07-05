'use client';
import { logger } from '@/lib/logger';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, Clock, CheckCircle } from 'lucide-react';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Apostila {
  id: string;
  title: string;
  description: string;
  concurso_id: string | null;
  created_at: string;
}

export default function ApostilasPage() {
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApostilas();
  }, []);

  const fetchApostilas = async () => {
    try {
      const response = await fetch('/api/apostilas');
      const data = await response.json();
      setApostilas(data.apostilas);
    } catch (error) {
      logger.error('Erro ao buscar apostilas', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Apostilas</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Apostilas</h1>
      <p className="text-muted-foreground">
        Acesse apostilas completas para seus estudos.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apostilas.map(apostila => (
          <Card key={apostila.id} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {apostila.title}
              </CardTitle>
              <CardDescription>{apostila.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>5 módulos</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~2h de leitura</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>0 módulos concluídos</span>
              </div>

              <Link
                href={`/dashboard/apostilas/${apostila.id}`}
                className="w-full"
              >
                <Button className="w-full">Acessar Apostila</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {apostilas.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma apostila disponível</CardTitle>
            <CardDescription>
              As apostilas serão adicionadas em breve. Fique atento às
              atualizações!
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
