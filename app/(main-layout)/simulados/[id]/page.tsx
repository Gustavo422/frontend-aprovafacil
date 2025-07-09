'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/features/shared/hooks/use-toast';
import { QuestionPlayer, SimuladoQuestion } from '@/components/question-player';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Simulado {
  id: string;
  title: string;
  description: string | null;
  questions_count: number;
  time_minutes: number;
  difficulty: string;
  created_at: string;
  concurso_id: string | null;
  is_public: boolean;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  concursos?: {
    id: string;
    nome: string;
    categoria: string;
    ano: number | null;
    banca: string | null;
  };
}

export default function SimuladoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [questoes, setQuestoes] = useState<SimuladoQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract the id directly from params
  const { id } = params;

  const fetchSimulado = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/simulados/${id}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar simulado');
      }

      const data = await response.json();
      setSimulado(data.simulado);
      setQuestoes(data.questoes || []);
    } catch (error) {
      logger.error('Erro ao buscar simulado:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Erro ao carregar simulado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSimulado();
  }, [fetchSimulado]);

  const handleComplete = async (
    answers: Record<number, string>,
    timeSpent: number
  ) => {
    try {
      // Calcular pontuação
      const totalQuestions = questoes.length;
      const correctAnswers = questoes.filter(
        (q, index) => answers[index] === q.correct_answer
      ).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Salvar progresso
      const response = await fetch(`/api/simulados/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          score: score,
          timeTaken: timeSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar progresso');
      }

      toast({
        title: 'Simulado finalizado!',
        description: `Você acertou ${correctAnswers} de ${totalQuestions} questões (${score}%).`,
      });

      // Redirecionar para a página de resultados
      router.push(`/dashboard/simulados/${id}/resultado`);
    } catch (error) {
      logger.error('Erro ao finalizar simulado:', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Erro',
        description: 'Erro ao salvar progresso. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !simulado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Erro ao carregar simulado</h2>
        <p className="text-muted-foreground">
          {error || 'Simulado não encontrado'}
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Nenhuma questão encontrada</h2>
        <p className="text-muted-foreground">
          Este simulado não possui questões disponíveis.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <QuestionPlayer
        questions={questoes}
        title={simulado.title}
        description={simulado.description || undefined}
        timeLimit={simulado.time_minutes}
        onComplete={handleComplete}
        showCorrectAnswers={false}
      />
    </div>
  );
}
