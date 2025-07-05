'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, XCircle, HelpCircle, CheckCircle } from 'lucide-react';

export interface FlashcardData {
  id: string | number;
  front: string;
  back: string;
  discipline?: string;
  tema?: string;
  subtema?: string;
}

interface FlashcardProps {
  flashcard: FlashcardData;
  onNext?: () => void;
  onPrev?: () => void;
  onRate?: (id: string | number, rating: 'easy' | 'medium' | 'hard') => void;
  showNavigation?: boolean;
}

export function Flashcard({
  flashcard,
  onNext,
  onPrev,
  onRate,
  showNavigation = true,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRated, setIsRated] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    if (onRate) {
      onRate(flashcard.id, rating);
    }
    setIsRated(true);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setIsRated(false);
    if (onNext) {
      onNext();
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setIsRated(false);
    if (onPrev) {
      onPrev();
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <Card
        className={`min-h-[250px] md:min-h-[300px] transition-all duration-300 ${
          isFlipped ? 'bg-muted/50' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base md:text-lg">
              {flashcard.discipline || 'Flashcard'}
            </span>
            {flashcard.tema && (
              <span className="text-xs md:text-sm font-normal text-muted-foreground">
                {flashcard.tema}{' '}
                {flashcard.subtema ? `- ${flashcard.subtema}` : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 flex-1">
          <div
            className="w-full cursor-pointer rounded-lg p-4 md:p-6 text-center min-h-[120px] md:min-h-[150px] flex items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
            onClick={handleFlip}
          >
            <p className="text-base md:text-lg leading-relaxed">
              {isFlipped ? flashcard.back : flashcard.front}
            </p>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Toque para {isFlipped ? 'ver a pergunta' : 'ver a resposta'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={handleFlip}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isFlipped ? 'Mostrar Pergunta' : 'Mostrar Resposta'}
          </Button>

          {isFlipped && !isRated && onRate && (
            <div className="flex flex-col sm:flex-row w-full justify-between gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                onClick={() => handleRate('hard')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Difícil</span>
                <span className="sm:hidden">D</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950/20"
                onClick={() => handleRate('medium')}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Médio</span>
                <span className="sm:hidden">M</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20"
                onClick={() => handleRate('easy')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Fácil</span>
                <span className="sm:hidden">F</span>
              </Button>
            </div>
          )}

          {showNavigation && (
            <div className="flex w-full justify-between gap-2">
              {onPrev && (
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  className="flex-1 h-10 text-sm"
                >
                  Anterior
                </Button>
              )}
              {onNext && (
                <Button
                  variant={isRated ? 'default' : 'ghost'}
                  onClick={handleNext}
                  className="flex-1 h-10 text-sm"
                >
                  Próximo
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 