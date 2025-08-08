"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
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
import { Flashcard } from '@/components/flashcard';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import { useConcurso } from '@/contexts/ConcursoContext';

interface FlashcardFromDB {
  id: string;
  front: string;
  back: string;
  disciplina?: string;
  tema?: string;
  subtema?: string;
  concurso_id?: string;
  criado_em: string;
}

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  disciplina: string;
  tema: string;
  subtema?: string;
}

interface WeakPoint {
  disciplina: string;
  error_count: number;
  total_questions: number;
  error_rate: number;
}

export default function FlashcardsPage() {
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const { activeConcursoId } = useConcurso();

  // Usar o hook customizado para buscar flashcards com filtro automático
  const {
    data: flashcardsFromDB = [],
    isLoading,
    error,
    hasConcurso,
    isLoadingConcurso
  } = useConcursoQuery<FlashcardFromDB[]>({
    endpoint: '/api/flashcards',
    requireConcurso: true,
    fallbackData: [],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Converter dados do banco para o formato esperado pelo componente
  const flashcards: FlashcardData[] = flashcardsFromDB.map((fc) => ({
    id: fc.id,
    front: fc.front,
    back: fc.back,
    disciplina: fc.disciplina || 'Sem disciplina',
    tema: fc.tema || 'Sem tema',
    subtema: fc.subtema,
  }));

  // Usar o hook customizado para buscar pontos fracos
  const {
    data: weakPoints = [],
    isLoading: isLoadingWeakPoints,
  } = useConcursoQuery<WeakPoint[]>({
    endpoint: '/api/weak-points',
    requireConcurso: true,
    fallbackData: [],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Loading state
  if (isLoading || isLoadingConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Cartões de Memorização</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Erro ao buscar flashcards:', {
      error: error instanceof Error ? error.message : String(error),
      concursoId: activeConcursoId,
    });
    
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Cartões de Memorização</h1>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar flashcards. Tente novamente.</p>
        </div>
      </div>
    );
  }

  // No concurso selected state
  if (!hasConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Cartões de Memorização</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar os flashcards disponíveis.
          </p>
        </div>
      </div>
    );
  }

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
    setSelectedTema(null);
    setCurrentFlashcardIndex(0);
  };

  const handleTemaChange = (value: string) => {
    setSelectedTema(value === 'all' ? null : value);
    setCurrentFlashcardIndex(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Cartões de Memorização</h1>
      <p className="text-muted-foreground">
        Pratique com cartões de memorização para fixar o conteúdo.
      </p>

      <Tabs defaultValue="estudar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="estudar">Estudar</TabsTrigger>
          <TabsTrigger value="pontos-fracos">Pontos Fracos</TabsTrigger>
        </TabsList>

        <TabsContent value="estudar" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedDisciplina || 'all'} onValueChange={handleDisciplinaChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {disciplinas.map((disciplina) => (
                  <SelectItem key={disciplina} value={disciplina}>
                    {disciplina}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTema || 'all'} onValueChange={handleTemaChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os temas</SelectItem>
                {temas.map((tema) => (
                  <SelectItem key={tema} value={tema}>
                    {tema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          {isLoadingWeakPoints ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : weakPoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">
                Nenhum ponto fraco identificado
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Continue estudando para identificar seus pontos fracos.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {weakPoints.map((weakPoint) => (
                <Card key={weakPoint.disciplina}>
                  <CardHeader>
                    <CardTitle>{weakPoint.disciplina}</CardTitle>
                    <CardDescription>
                      Taxa de erro: {Math.round(weakPoint.error_rate * 100)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>Erros:</span>
                        <span className="font-medium">{weakPoint.error_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Total:</span>
                        <span className="font-medium">{weakPoint.total_questions}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      Estudar {weakPoint.disciplina}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
