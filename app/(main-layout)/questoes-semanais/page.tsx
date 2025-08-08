"use client";

import { useState, useCallback, useMemo } from 'react';
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
import { QuestionPlayer } from '@/components/question-player';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import { useConcurso } from '@/contexts/ConcursoContext';

interface QuestaoSemanal {
  id: string;
  week_number: number;
  year: number;
  titulo: string;
  descricao: string;
  questoes: Questao[];
  historico: HistoricoQuestao[];
}

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: string;
  explicacao: string;
}

interface HistoricoQuestao {
  id: string;
  week_number: number;
  year: number;
  data_resposta: string;
  acertos: number;
  total_questoes: number;
  tempo_gasto: number;
  concluido_at: string;
  score: number;
  total_questions: number;
}

interface QuestoesSemanaisData {
  questao_semanal: QuestaoSemanal | null;
  questoes: Questao[];
  historico: HistoricoQuestao[];
}

export default function QuestoesSemanaisPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [isconcluido, setIsconcluido] = useState(false);
  const { activeConcursoId } = useConcurso();

  // Usar o hook customizado para buscar questões semanais com filtro automático
  const { data: questoesSemanais, isLoading: isLoadingQuestoesSemanais, error, hasConcurso } = useConcursoQuery<QuestoesSemanaisData>({
    endpoint: '/api/questoes-semanais',
    requireConcurso: true,
    fallbackData: { questao_semanal: null, questoes: [], historico: [] },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Memoizar questoes para evitar re-renders desnecessários
  const questoes = useMemo(() => {
    return questoesSemanais?.questoes || [];
  }, [questoesSemanais?.questoes]);

  // Memoizar questaoSemanal para evitar re-renders desnecessários
  const questaoSemanal = useMemo(() => {
    return questoesSemanais?.questao_semanal || null;
  }, [questoesSemanais?.questao_semanal]);

  const historico = questoesSemanais?.historico || [];

  const [results, setResults] = useState<{
    answers: Record<number, string>;
    score: number;
    timeSpent: number;
  } | null>(null);

  const handleStart = useCallback(() => {
    setIsStarted(true);
  }, []);

  const handleComplete = useCallback(
    (answers: Record<number, string>, timeSpent: number) => {
      // Calcular score baseado nas respostas
      const score = Object.entries(answers).reduce((acc, [questionIndex, answer]) => {
        const question = questoes[parseInt(questionIndex)];
        return acc + (question && question.resposta_correta === answer ? 1 : 0);
      }, 0);
      
      setResults({ answers, score, timeSpent });
      setIsconcluido(true);
      setIsStarted(false);
    },
    [questoes]
  );

  // Loading state
  if (isLoadingQuestoesSemanais) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Questões Semanais</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Erro ao buscar questões semanais:', {
      error: error instanceof Error ? error.message : String(error),
      concursoId: activeConcursoId,
    });
    
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Questões Semanais</h1>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar questões semanais. Tente novamente.</p>
        </div>
      </div>
    );
  }

  // No concurso selected state
  if (!hasConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Questões Semanais</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar as questões semanais disponíveis.
          </p>
        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Semana {questaoSemanal.week_number} - {questaoSemanal.year}
                </CardTitle>
                <CardDescription>{questaoSemanal.titulo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {questaoSemanal.descricao}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{questoes.length} questões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>~{Math.ceil(questoes.length * 2)} min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleStart}
                  className="w-full"
                  disabled={questoes.length === 0}
                >
                  {questoes.length === 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando questões...
                    </>
                  ) : (
                    'Iniciar Questões'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <QuestionPlayer
              title={`Questões Semanais - Semana ${questaoSemanal?.week_number}`}
              questions={questoes.map(q => ({
                id: q.id,
                text: q.enunciado,
                options: q.alternativas.map((alt, index) => ({
                  id: index.toString(),
                  text: alt
                })),
                correctAnswer: q.resposta_correta,
                explanation: q.explicacao
              }))}
              onComplete={handleComplete}
            />
          )}

          {isconcluido && results && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Semana {questaoSemanal?.week_number}</CardTitle>
                <CardDescription>
                  Parabéns por completar as questões desta semana!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((results.score / questoes.length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Aproveitamento</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.score}/{questoes.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Acertos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(results.timeSpent / 60)}min
                    </div>
                    <div className="text-sm text-muted-foreground">Tempo</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso Geral</span>
                    <span className="font-medium">
                      {historico.length} semanas completadas
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((historico.length / 52) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    setIsconcluido(false);
                    setResults(null);
                  }}
                  className="w-full"
                >
                  Ver Histórico
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {historico.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum histórico disponível</CardTitle>
                <CardDescription>
                  Complete questões semanais para ver seu histórico.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {historico.map((item) => (
                <Card key={`${item.year}-${item.week_number}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Semana {item.week_number} - {item.year}
                    </CardTitle>
                    <CardDescription>
                      Concluído em {new Date(item.concluido_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{item.score}/{item.total_questions} acertos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {Math.round((item.score / item.total_questions) * 100)}%
                        </span>
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