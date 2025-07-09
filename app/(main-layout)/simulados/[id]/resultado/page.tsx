'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface SimuladoQuestion {
  id: string;
  simulado_id: string;
  question_number: number;
  question_text: string;
  alternatives: Record<string, string>;
  correct_answer: string;
  explanation?: string;
  discipline?: string;
  topic?: string;
  difficulty?: string;
  concurso_id?: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  simulado_id: string;
  score: number;
  completed_at: string;
  time_taken_minutes: number;
  answers: Record<number, string>;
}

export default function ResultadoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [questoes, setQuestoes] = useState<SimuladoQuestion[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/simulados/${id}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do simulado');
        }

        const data = await response.json();
        setSimulado(data.simulado);
        setQuestoes(data.questoes || []);
        setProgress(data.progress);
      } catch (error) {
        logger.error('Erro ao buscar dados do simulado:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setError('Erro ao carregar dados do simulado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
        <p className="text-muted-foreground">
          {error || 'Dados do simulado não encontrados'}
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  // Calcular estatísticas baseadas nos dados reais
  const totalQuestions = questoes.length;
  const correctAnswers = questoes.filter(
    (q, index) => progress.answers[index] === q.correct_answer
  ).length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const score = (correctAnswers / totalQuestions) * 100;

  // Formatar o tempo
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Resultado do Simulado
        </h1>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="font-medium">
            {formatTime(progress.time_taken_minutes)}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{simulado.title}</CardTitle>
          <CardDescription>{simulado.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pontuação</span>
                <span className="text-sm font-medium">{score.toFixed(1)}%</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center rounded-lg border p-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <span className="mt-2 text-2xl font-bold">
                  {correctAnswers}
                </span>
                <span className="text-sm text-muted-foreground">Acertos</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border p-4">
                <XCircle className="h-8 w-8 text-red-500" />
                <span className="mt-2 text-2xl font-bold">{wrongAnswers}</span>
                <span className="text-sm text-muted-foreground">Erros</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">
                  Tempo Total
                </span>
                <span className="text-lg font-medium">
                  {formatTime(progress.time_taken_minutes)}
                </span>
              </div>
              <div className="flex flex-col rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">
                  Tempo Médio por Questão
                </span>
                <span className="text-lg font-medium">
                  {formatTime(
                    Math.round(progress.time_taken_minutes / totalQuestions)
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/dashboard/simulados">
            <Button variant="outline">Voltar para Simulados</Button>
          </Link>
          <Link href={`/dashboard/simulados/${id}`}>
            <Button>Refazer Simulado</Button>
          </Link>
        </CardFooter>
      </Card>

      <h2 className="mt-4 text-xl font-bold tracking-tight">
        Revisão das Questões
      </h2>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="corretas">Corretas</TabsTrigger>
          <TabsTrigger value="incorretas">Incorretas</TabsTrigger>
        </TabsList>
        <TabsContent value="todas" className="space-y-4">
          {questoes.map((question, index) => {
            const _userAnswer = progress.answers[index];
            const isCorrect = _userAnswer === question.correct_answer;
            
            return (
            <Card
              key={question.id}
                className={isCorrect ? 'border-green-200' : 'border-red-200'}
            >
              <CardHeader>
                <CardTitle className="flex items-start gap-2">
                    {isCorrect ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  )}
                    <span>{question.question_text}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    {Object.entries(question.alternatives).map(([key, text]) => (
                    <div
                        key={key}
                      className={`flex items-start space-x-2 rounded-md border p-3 ${
                          key === question.correct_answer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : key === _userAnswer && key !== question.correct_answer
                            ? 'border-red-500 bg-red-50 dark:bg-red-950'
                            : ''
                      }`}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border">
                          {key}
                        </div>
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
              </CardContent>
            </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="corretas" className="space-y-4">
          {questoes
            .filter((question, index) => progress.answers[index] === question.correct_answer)
            .map((question, index) => {
              const _userAnswer = progress.answers[index];
              
              return (
              <Card key={question.id} className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>{question.question_text}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                      {Object.entries(question.alternatives).map(([key, text]) => (
                      <div
                          key={key}
                        className={`flex items-start space-x-2 rounded-md border p-3 ${
                            key === question.correct_answer
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : ''
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border">
                            {key}
                          </div>
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
                </CardContent>
              </Card>
              );
            })}
        </TabsContent>
        <TabsContent value="incorretas" className="space-y-4">
          {questoes
            .filter((question, index) => progress.answers[index] !== question.correct_answer)
            .map((question, index) => {
              const _userAnswer = progress.answers[index];
              
              return (
              <Card key={question.id} className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span>{question.question_text}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                      {Object.entries(question.alternatives).map(([key, text]) => (
                      <div
                          key={key}
                        className={`flex items-start space-x-2 rounded-md border p-3 ${
                            key === question.correct_answer
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : key === _userAnswer
                              ? 'border-red-500 bg-red-50 dark:bg-red-950'
                              : ''
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border">
                            {key}
                          </div>
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
                </CardContent>
              </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
