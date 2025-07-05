'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionPlayer } from '@/components/question-player';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface QuestaoSemanal {
  id: string;
  title: string;
  description: string;
  week_number: number;
  year: number;
  concurso_id?: string;
  created_at: string;
}

interface Questao {
  id: string;
  question_text: string;
  alternatives: Record<string, string>;
  correct_answer: string;
  explanation?: string;
  discipline?: string;
  topic?: string;
}

interface HistoricoQuestao {
  id: string;
  title: string;
  description: string;
  week_number: number;
  year: number;
  score: number;
  total_questions: number;
  completed_at: string;
}

export default function QuestoesSemanaisPage() {
  const [_activeTab, setActiveTab] = useState('atual');
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questaoSemanal, setQuestaoSemanal] = useState<QuestaoSemanal | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [historico, setHistorico] = useState<HistoricoQuestao[]>([]);
  const [results, setResults] = useState<{
    answers: Record<number, string>;
    score: number;
    timeSpent: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar questão semanal atual
      const questoesResponse = await fetch('/api/questoes-semanais');
      if (!questoesResponse.ok) {
        throw new Error('Erro ao carregar questões semanais');
      }
      const questoesData = await questoesResponse.json();
      
      if (questoesData.questaoSemanal) {
        setQuestaoSemanal(questoesData.questaoSemanal);
        setQuestoes(questoesData.questoes || []);
      } else {
        setQuestaoSemanal(null);
        setQuestoes([]);
      }
      
      if (questoesData.historico) {
        setHistorico(questoesData.historico);
      }

    } catch (error) {
      logger.error('Erro ao buscar questões semanais:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Erro ao carregar questões semanais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStart = useCallback(() => {
    setIsStarted(true);
  }, []);

  const handleComplete = useCallback((
    answers: Record<number, string>,
    timeSpent: number
  ) => {
    if (!questaoSemanal) return;

    // Calcular pontuação
    const score = questoes.filter(
      (q, index) => answers[index] === q.correct_answer
    ).length;

    setResults({
      answers,
      score,
      timeSpent,
    });

    setIsCompleted(true);
  }, [questaoSemanal, questoes]);

  const handleRetry = useCallback(() => {
    setIsStarted(false);
    setIsCompleted(false);
    setResults(null);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Erro ao carregar questões semanais</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchData}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Questões Semanais</h1>
      <p className="text-muted-foreground">
        Pratique com questões selecionadas semanalmente.
      </p>

      <Tabs
        defaultValue="atual"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="atual">Semana Atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="atual" className="space-y-4">
          {!questaoSemanal ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma questão semanal disponível</CardTitle>
                <CardDescription>
                  Não há questões semanais disponíveis no momento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Volte mais tarde para ver as próximas questões semanais.
                </p>
              </CardContent>
            </Card>
          ) : !isStarted ? (
            <Card>
              <CardHeader>
                <CardTitle>{questaoSemanal.title}</CardTitle>
                <CardDescription>
                  {questaoSemanal.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>
                      Semana {questaoSemanal.week_number} de{' '}
                      {questaoSemanal.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {questoes.length} questões
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>
                      Tempo estimado:{' '}
                      {Math.ceil(questoes.length * 1.5)} minutos
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleStart}>
                  Iniciar Questões Semanais
                </Button>
              </CardFooter>
            </Card>
          ) : isCompleted ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Resultado - {questaoSemanal.title}
                </CardTitle>
                <CardDescription>
                  {questaoSemanal.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pontuação</span>
                      <span className="text-sm font-medium">
                        {results?.score} de {questoes.length} (
                        {Math.round(
                          ((results?.score || 0) / questoes.length) * 100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={
                        ((results?.score || 0) / questoes.length) * 100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center rounded-lg border p-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <span className="mt-2 text-2xl font-bold">
                        {results?.score}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Acertos
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border p-4">
                      <Clock className="h-8 w-8 text-blue-500" />
                      <span className="mt-2 text-2xl font-bold">
                        {Math.round((results?.timeSpent || 0) / 60)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Minutos
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleRetry}
                >
                  Refazer Questões
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <QuestionPlayer
              title={questaoSemanal.title}
              questions={questoes.map((q, _index) => ({
                id: q.id,
                text: q.question_text,
                options: Object.entries(q.alternatives).map(([key, value]) => ({
                  id: key,
                  text: value,
                })),
                correctAnswer: q.correct_answer,
              }))}
              onComplete={handleComplete}
            />
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {historico.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum histórico disponível</CardTitle>
                <CardDescription>
                  Complete algumas questões semanais para ver seu histórico.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {historico.map(item => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Semana {item.week_number} de {item.year}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {item.score} de {item.total_questions} (
                            {Math.round((item.score / item.total_questions) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.completed_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
