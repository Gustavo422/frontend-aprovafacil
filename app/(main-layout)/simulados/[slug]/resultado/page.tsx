'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface Simulado {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  numero_questoes: number;
  tempo_minutos: number;
  dificuldade: string;
  criado_em: string;
  concurso_id: string | null;
  publico: boolean;
  atualizado_em: string;
}

interface SimuladoQuestion {
  id: string;
  simulado_id: string;
  question_number?: number;
  question_text?: string;
  alternativas?: Record<string, string>;
  correct_answer?: string;
  resposta_correta?: string;
  explanation?: string;
  disciplina?: string;
  topic?: string;
  difficulty?: string;
  concurso_id?: string;
}

interface UserProgress {
  id: string;
  usuario_id: string;
  simulado_id: string;
  pontuacao?: number;
  score?: number;
  concluido_em?: string;
  completed_at?: string;
  tempo_gasto_minutos: number;
  time_taken_minutes?: number;
  respostas: Record<number, string>;
  answers?: Record<number, string>;
}

export default function ResultadoBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [questoes, setQuestoes] = useState<SimuladoQuestion[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/simulados/slug/${slug}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do simulado');

        const data = await response.json();
        const payload = data?.data ?? data;
        // payload é somente o detalhe do simulado; buscar questões em chamada separada
        setSimulado(payload);
        const qRes = await fetch(`/api/simulados/slug/${slug}/questoes`);
        const qJson = await qRes.json();
        setQuestoes((qJson?.data ?? qJson) || []);

        const progRes = await fetch(`/api/simulados/slug/${slug}/progresso`);
        const progData = await progRes.json();
        const arr = progData?.data ?? [];
        const progressPayload = Array.isArray(arr) ? (arr[0] ?? null) : (arr ?? null);
        setProgress(progressPayload);
      } catch (err) {
        logger.error('Erro ao buscar dados do simulado:', {
          error: err instanceof Error ? err.message : String(err),
        });
        setError('Erro ao carregar dados do simulado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !simulado || !progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Erro ao carregar resultado</h2>
        <p className="text-muted-foreground">{error || 'Dados do simulado não encontrados'}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const totalQuestions = questoes.length;
  const answers = progress.answers ?? progress.respostas ?? {};
  const correctAnswers = questoes.filter((q, index) => {
    const correct = (q.resposta_correta ?? q.correct_answer) as string | undefined;
    return answers[index] === correct;
  }).length;
  const score = (correctAnswers / Math.max(totalQuestions, 1)) * 100;
  const timeTaken = progress.time_taken_minutes ?? progress.tempo_gasto_minutos ?? 0;

  const formatTime = (minutes: number) => {
    const safe = Math.max(0, Math.floor(minutes));
    const hrs = Math.floor(safe / 60);
    const mins = safe % 60;
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Resultado do Simulado</h1>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="font-medium">{formatTime(timeTaken)}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 pb-4 border-b">
          <h2 className="text-2xl font-bold tracking-tight">{simulado.titulo}</h2>
          {simulado.descricao && <p className="mt-1 text-sm text-muted-foreground">{simulado.descricao}</p>}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pontuação</span>
                  <span className="text-sm font-medium">{score.toFixed(1)}%</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold leading-none">{correctAnswers}</div>
                    <div className="text-xs text-muted-foreground">Acertos</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold leading-none">{Math.max(totalQuestions - correctAnswers, 0)}</div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1 space-y-3 rounded-lg border p-4 bg-muted/40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tempo Total</span>
                <span className="text-sm font-medium">{formatTime(timeTaken)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tempo Médio (por questão)</span>
                <span className="text-sm font-medium">{formatTime(Math.ceil(timeTaken / Math.max(totalQuestions, 1)))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Questões</span>
                <span className="text-sm font-medium">{totalQuestions}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center p-6 pt-0 justify-between border-t">
          <Link href="/simulados">
            <Button variant="outline">Voltar para Simulados</Button>
          </Link>
          <Link href={`/simulados/${slug}`}>
            <Button>Refazer Simulado</Button>
          </Link>
        </div>
      </div>

      <h2 className="mt-4 text-xl font-bold tracking-tight">Revisão das Questões</h2>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="corretas">Corretas</TabsTrigger>
          <TabsTrigger value="incorretas">Incorretas</TabsTrigger>
        </TabsList>
        <TabsContent value="todas" className="space-y-4">
          {questoes.map((question, index) => {
            const correct = (question.resposta_correta ?? question.correct_answer) as string | undefined;
            const isCorrect = (answers as Record<number, string>)[index] === correct;
            const alternativas = (question as unknown as { alternativas?: Record<string, string> }).alternativas ?? {};
            return (
              <div key={question.id} className={`rounded-lg border bg-card text-card-foreground shadow-sm ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    )}
                    <span>{(question as unknown as { question_text?: string }).question_text ?? ''}</span>
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <div className="space-y-2">
                    {Object.entries(alternativas).map(([key, text]) => (
                      <div key={key} className={`flex items-start space-x-2 rounded-md border p-3 ${key === correct ? 'border-green-500 bg-green-50 dark:bg-green-950' : key === (answers as Record<number, string>)[index] && key !== correct ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border">{key}</div>
                        <span className="text-sm">{text}</span>
                      </div>
                    ))}
                    {question.explanation && (
                      <div className="mt-4 rounded-md bg-muted p-4">
                        <h4 className="mb-2 font-medium">Explicação:</h4>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="corretas" className="space-y-4">
          {questoes
            .filter((question, index) => {
              const correct = (question.resposta_correta ?? question.correct_answer) as string | undefined;
              return (answers as Record<number, string>)[index] === correct;
            })
            .map((question) => {
              const alternativas = (question as unknown as { alternativas?: Record<string, string> }).alternativas ?? {};
              const correct = (question.resposta_correta ?? question.correct_answer) as string | undefined;
              return (
                <div key={question.id} className="rounded-lg border bg-card text-card-foreground shadow-sm border-green-200">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>{(question as unknown as { question_text?: string }).question_text ?? ''}</span>
                    </h3>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-2">
                      {Object.entries(alternativas).map(([key, text]) => (
                        <div key={key} className={`flex items-start space-x-2 rounded-md border p-3 ${key === correct ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border">{key}</div>
                          <span className="text-sm">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </TabsContent>
        <TabsContent value="incorretas" className="space-y-4">
          {questoes
            .filter((question, index) => {
              const correct = (question.resposta_correta ?? question.correct_answer) as string | undefined;
              return (answers as Record<number, string>)[index] !== correct;
            })
            .map((question, index) => {
              const alternativas = (question as unknown as { alternativas?: Record<string, string> }).alternativas ?? {};
              const correct = (question.resposta_correta ?? question.correct_answer) as string | undefined;
              return (
                <div key={question.id} className="rounded-lg border bg-card text-card-foreground shadow-sm border-red-200">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span>{(question as unknown as { question_text?: string }).question_text ?? ''}</span>
                    </h3>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-2">
                      {Object.entries(alternativas).map(([key, text]) => (
                        <div key={key} className={`flex items-start space-x-2 rounded-md border p-3 ${key === correct ? 'border-green-500 bg-green-50 dark:bg-green-950' : key === (answers as Record<number, string>)[index] && key !== correct ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border">{key}</div>
                          <span className="text-sm">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}