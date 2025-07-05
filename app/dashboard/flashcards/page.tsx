'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flashcard, type FlashcardData } from '@/components/flashcard';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface FlashcardFromDB {
  id: string;
  front: string;
  back: string;
  disciplina?: string;
  tema?: string;
  subtema?: string;
  concurso_id?: string;
  created_at: string;
}

interface WeakPoint {
  disciplina: string;
  tema: string;
  error_count: number;
  total_questions: number;
  error_rate: number;
}

export default function FlashcardsPage() {
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(
    null
  );
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar flashcards
        const flashcardsResponse = await fetch('/api/flashcards');
        if (!flashcardsResponse.ok) {
          throw new Error('Erro ao carregar flashcards');
        }
        const flashcardsData = await flashcardsResponse.json();
        
        // Converter para o formato esperado pelo componente
        const convertedFlashcards: FlashcardData[] = flashcardsData.map((fc: FlashcardFromDB) => ({
          id: fc.id,
          front: fc.front,
          back: fc.back,
          disciplina: fc.disciplina || 'Sem disciplina',
          tema: fc.tema || 'Sem tema',
          subtema: fc.subtema,
        }));
        
        setFlashcards(convertedFlashcards);

        // Buscar pontos fracos (se houver API)
        try {
          const weakPointsResponse = await fetch('/api/weak-points');
          if (weakPointsResponse.ok) {
            const weakPointsData = await weakPointsResponse.json();
            setWeakPoints(weakPointsData);
          }
        } catch {
          // Se não houver API de pontos fracos, usar dados vazios
          logger.info('API de pontos fracos não disponível');
        }

      } catch (error) {
        logger.error('Erro ao buscar dados dos flashcards:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setError('Erro ao carregar flashcards. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar flashcards com base na disciplina e tema selecionados
  const filteredFlashcards = flashcards.filter(flashcard => {
    if (selectedDisciplina && flashcard.disciplina !== selectedDisciplina) {
      return false;
    }
    if (selectedTema && flashcard.tema !== selectedTema) {
      return false;
    }
    return true;
  });

  const currentFlashcard = filteredFlashcards[currentFlashcardIndex];

  // Obter disciplinas únicas
  const disciplinas = Array.from(
    new Set(flashcards.map(f => f.disciplina).filter(Boolean))
  );

  // Obter temas únicos para a disciplina selecionada
  const temas = Array.from(
    new Set(
      flashcards
        .filter(f => !selectedDisciplina || f.disciplina === selectedDisciplina)
        .map(f => f.tema)
        .filter(Boolean)
    )
  );

  const handleNext = () => {
    if (currentFlashcardIndex < filteredFlashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
    } else {
      setCurrentFlashcardIndex(0); // Voltar ao início
    }
  };

  const handlePrev = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1);
    } else {
      setCurrentFlashcardIndex(filteredFlashcards.length - 1); // Ir para o último
    }
  };

  const handleRate = (
    id: string | number,
    rating: 'easy' | 'medium' | 'hard'
  ) => {
    // TODO: Implementar envio da avaliação para o backend
    logger.info(`Flashcard ${id} rated as ${rating}`);
  };

  const handleDisciplinaChange = (value: string) => {
    setSelectedDisciplina(value === 'all' ? null : value);
    setSelectedTema(null); // Resetar o tema quando a disciplina mudar
    setCurrentFlashcardIndex(0); // Voltar ao primeiro flashcard
  };

  const handleTemaChange = (value: string) => {
    setSelectedTema(value === 'all' ? null : value);
    setCurrentFlashcardIndex(0); // Voltar ao primeiro flashcard
  };

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
        <h2 className="text-xl font-semibold">Erro ao carregar flashcards</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
      <p className="text-muted-foreground">
        Pratique com flashcards dinâmicos baseados nos seus pontos fracos.
      </p>

      <Tabs defaultValue="estudar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="estudar">Estudar</TabsTrigger>
          <TabsTrigger value="pontos-fracos">Pontos Fracos</TabsTrigger>
        </TabsList>

        <TabsContent value="estudar" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Select
                value={selectedDisciplina || 'all'}
                onValueChange={handleDisciplinaChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {disciplinas.map(disciplina => (
                    <SelectItem key={disciplina ?? ''} value={disciplina ?? ''}>
                      {disciplina ?? 'Sem disciplina'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTema || 'all'}
                onValueChange={handleTemaChange}
                disabled={!selectedDisciplina}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os temas</SelectItem>
                  {temas.map(tema => (
                    <SelectItem key={tema ?? ''} value={tema ?? ''}>
                      {tema ?? 'Sem tema'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Flashcard
            </Button>
          </div>

          {filteredFlashcards.length > 0 ? (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Flashcard {currentFlashcardIndex + 1} de{' '}
                {filteredFlashcards.length}
              </div>

              <Flashcard
                flashcard={currentFlashcard}
                onNext={handleNext}
                onPrev={handlePrev}
                onRate={handleRate}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">
                Nenhum flashcard encontrado
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {flashcards.length === 0 
                  ? 'Não há flashcards disponíveis no sistema.'
                  : 'Não há flashcards disponíveis para os filtros selecionados.'
                }
              </p>
              {flashcards.length > 0 && (
                <Button
                  onClick={() => {
                    setSelectedDisciplina(null);
                    setSelectedTema(null);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pontos-fracos" className="space-y-4">
          {weakPoints.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weakPoints.map((pontoFraco, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{pontoFraco.disciplina}</CardTitle>
                    <CardDescription>{pontoFraco.tema}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Taxa de erro: {pontoFraco.error_rate.toFixed(1)}% ({pontoFraco.error_count} de {pontoFraco.total_questions} questões)
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedDisciplina(pontoFraco.disciplina);
                        setSelectedTema(pontoFraco.tema);
                      }}
                    >
                      Estudar Flashcards
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">
                Nenhum ponto fraco identificado
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Complete alguns simulados para que possamos identificar seus pontos fracos.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
