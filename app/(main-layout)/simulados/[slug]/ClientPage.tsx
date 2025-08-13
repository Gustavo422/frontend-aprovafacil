"use client";
import React, { useEffect } from 'react';
import { QuestionPlayer } from "@/components/question-player";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/features/shared/hooks/use-toast";
import { logger } from "@/lib/logger";
import { useBuscarSimuladoPorSlug, type QuestaoSimulado } from "@/src/features/simulados";
import { useSubmitProgressoSimulado } from "@/src/features/simulados/hooks/use-submit-progresso";
import { useBlockNavigation } from "@/src/features/simulados/hooks/use-block-navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ClientPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const { simulado, questoes, isLoading, error } = useBuscarSimuladoPorSlug(slug);
  const submitMutation = useSubmitProgressoSimulado(slug);

  // Bloqueio de navegação (back) com diálogo de confirmação
  const { dialogOpen, setDialogOpen, disableBlocking } = useBlockNavigation(true);
  const [progressInfo, setProgressInfo] = React.useState<{ answered: number; total: number }>({ answered: 0, total: 0 });

  const handleComplete = async (
    answers: Record<number, string>,
    timeSpent: number
  ) => {
    try {
      const totalQuestions = (questoes || []).length;
      const correctAnswers = (questoes || []).filter((q: QuestaoSimulado, index: number) => {
        return answers[index] === q.resposta_correta;
      }).length;
      const score = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
      await submitMutation.mutateAsync({ answers, score, timeTaken: timeSpent });
      disableBlocking();
      toast({
        title: 'Simulado finalizado!',
        descricao: `Você acertou ${correctAnswers} de ${totalQuestions} questões (${score}%).`,
      });
      router.push(`/simulados/${slug}/resultado`);
    } catch (err) {
      logger.error('Erro ao finalizar simulado:', {
        error: err instanceof Error ? err.message : String(err),
      });
      toast({ title: 'Erro', descricao: 'Erro ao salvar progresso. Tente novamente.', variant: 'destructive' });
    }
  };

  if (isLoading) {
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
        <p className="text-muted-foreground">{(error as Error)?.message || 'Simulado não encontrado'}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  if (!questoes || questoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Nenhuma questão encontrada</h2>
        <p className="text-muted-foreground">Este simulado não possui questões disponíveis.</p>
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
        questions={questoes as any}
        title={simulado.titulo}
        description={simulado.descricao || undefined}
        timeLimit={simulado.tempo_minutos}
        onComplete={handleComplete}
        showCorrectAnswers={false}
        onProgressChange={({ hasProgress, answered, total }) => {
          setProgressInfo({ answered, total });
          if (!hasProgress && dialogOpen) setDialogOpen(false);
        }}
      />

      {/* Diálogo de confirmação de saída */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonar este simulado?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span>Você respondeu {progressInfo.answered} de {progressInfo.total} questões.</span>
              <div className="text-muted-foreground">Ao sair agora, seu progresso pode não ser salvo.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogOpen(false)}>Continuar no simulado</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                disableBlocking();
                router.back();
              }}
            >
              Sair mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


