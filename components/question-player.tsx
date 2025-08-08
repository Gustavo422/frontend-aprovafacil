'use client';

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// Interface para questões do novo esquema
export interface SimuladoQuestion {
  id: string;
  simulado_id: string;
  question_number: number;
  enunciado: string;
  alternativas: Record<string, string>; // { "A": "texto", "B": "texto", etc }
  resposta_correta: string;
  explicacao?: string;
  disciplina?: string;
  tema?: string;
  dificuldade?: string;
  concurso_id?: string;
}

// Interface para compatibilidade com o componente existente
export interface Question {
  id: number | string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  respostaCorreta?: string;
  explicacao?: string;
  disciplina?: string;
  tema?: string;
  dificuldade?: string;
}

interface QuestionPlayerProps {
  questions: Question[] | SimuladoQuestion[];
  title: string;
  description?: string;
  timeLimit?: number; // em minutos
  onComplete?: (answers: Record<number, string>, timeSpent: number) => void;
  showCorrectAnswers?: boolean;
}

// Função para converter questões do novo esquema para o formato do componente
// Memoized to prevent unnecessary conversions
const useNormalizedQuestions = (questions: Question[] | SimuladoQuestion[]): Question[] => {
  return useMemo(() => {
    if (Array.isArray(questions) && questions.length > 0 && 'alternativas' in questions[0]) {
      return (questions as SimuladoQuestion[]).map(q => ({
        id: q.question_number,
        text: q.enunciado,
        options: Object.entries(q.alternativas).map(([key, value]) => ({
          id: key,
          text: value,
        })),
        respostaCorreta: q.resposta_correta,
        explicacao: q.explicacao,
        disciplina: q.disciplina,
        tema: q.tema,
        dificuldade: q.dificuldade,
      }));
    }
    return questions as Question[];
  }, [questions]);
};

// Memoized format time function
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Memoized question option component
const QuestionOption = memo(({ 
  option, 
  isSelected, 
  isCorrect, 
  isWrong, 
  onSelect, 
  showCorrectAnswers 
}: { 
  option: { id: string; text: string }; 
  isSelected: boolean; 
  isCorrect: boolean; 
  isWrong: boolean; 
  onSelect: (id: string) => void; 
  showCorrectAnswers: boolean;
}) => {
  return (
    <div
      className={`flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted transition-colors cursor-pointer ${
        isCorrect
          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
          : isWrong
            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
            : isSelected
              ? 'border-primary bg-primary/5'
              : 'border-border'
      }`}
      onClick={() => onSelect(option.id)}
    >
      <RadioGroupItem
        value={option.id}
        id={`option-${option.id}`}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`option-${option.id}`}
          className="text-sm md:text-base font-medium leading-relaxed cursor-pointer block"
        >
          {option.text}
        </label>
        {showCorrectAnswers && (
          <div className="flex items-center gap-2 mt-2">
            {isCorrect && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Resposta correta
                </span>
              </div>
            )}
            {isWrong && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Resposta incorreta
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
QuestionOption.displayName = 'QuestionOption';

// Memoized question navigation button
const NavigationButton = memo(({ 
  index, 
  currentQuestion, 
  hasAnswer, 
  onClick 
}: { 
  index: number; 
  currentQuestion: number; 
  hasAnswer: boolean; 
  onClick: () => void;
}) => {
  return (
    <Button
      variant={
        currentQuestion === index
          ? 'default'
          : hasAnswer
            ? 'outline'
            : 'ghost'
      }
      className={`h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm ${
        hasAnswer ? 'border-primary' : ''
      }`}
      onClick={onClick}
    >
      {index + 1}
    </Button>
  );
});
NavigationButton.displayName = 'NavigationButton';

// Memoized question header component
const QuestionHeader = memo(({ 
  question, 
  currentNumber 
}: { 
  question: Question; 
  currentNumber: number;
}) => {
  return (
    <CardHeader className="pb-4">
      <CardTitle className="flex items-start gap-3 text-base md:text-lg">
        <span className="mt-0.5 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
          {currentNumber}
        </span>
        <span className="leading-relaxed">{question.text}</span>
      </CardTitle>
      {question.disciplina && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Disciplina:</span>
          <span>{question.disciplina}</span>
          {question.tema && (
            <>
              <span>•</span>
              <span>{question.tema}</span>
            </>
          )}
          {question.dificuldade && (
            <>
              <span>•</span>
              <span className="capitalize">{question.dificuldade}</span>
            </>
          )}
        </div>
      )}
    </CardHeader>
  );
});
QuestionHeader.displayName = 'QuestionHeader';

export const QuestionPlayer = memo(({
  questions,
  title,
  description,
  timeLimit,
  onComplete,
  showCorrectAnswers = false,
}: QuestionPlayerProps) => {
  // Use memoized normalized questions
  const normalizedQuestions = useNormalizedQuestions(questions);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : 0); // em segundos
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());

  // Finalizar quiz - memoized to prevent recreation on each render
  const finishQuiz = useCallback(() => {
    setIsFinished(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60); // em minutos
    if (onComplete) {
      onComplete(answers, timeSpent);
    }
  }, [onComplete, answers, startTime]);

  // Timer para questões com limite de tempo
  useEffect(() => {
    if (!timeLimit || isFinished) return () => {};

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, isFinished, finishQuiz]);

  // Navegar para a próxima questão - memoized
  const nextQuestion = useCallback(() => {
    if (currentQuestion < normalizedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  }, [currentQuestion, normalizedQuestions.length]);

  // Navegar para a questão anterior - memoized
  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion]);

  // Salvar resposta - memoized
  const saveAnswer = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  }, [currentQuestion]);

  // Calcular progresso - memoized
  const progress = useMemo(() => {
    return ((currentQuestion + 1) / normalizedQuestions.length) * 100;
  }, [currentQuestion, normalizedQuestions.length]);

  // Questão atual - memoized
  const question = useMemo(() => {
    return normalizedQuestions[currentQuestion];
  }, [normalizedQuestions, currentQuestion]);

  // Memoized navigation button click handler
  const handleNavigationClick = useCallback((index: number) => {
    setCurrentQuestion(index);
  }, []);

  // Memoized formatted time
  const formattedTimeLeft = useMemo(() => {
    return formatTime(timeLeft);
  }, [timeLeft]);

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {title}
          </h2>
          {timeLimit && (
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              <span className="font-medium text-sm md:text-base">
                {formattedTimeLeft}
              </span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Questão {currentQuestion + 1} de {normalizedQuestions.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={finishQuiz}
            className="w-full sm:w-auto"
          >
            <Flag className="mr-2 h-4 w-4" />
            Finalizar
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="w-full">
        <QuestionHeader question={question} currentNumber={currentQuestion + 1} />
        <CardContent className="pb-4">
          <RadioGroup
            value={answers[currentQuestion] || ''}
            onValueChange={saveAnswer}
            className="space-y-3"
          >
            {question.options.map(option => {
              const isSelected = answers[currentQuestion] === option.id;
              const isCorrect =
                showCorrectAnswers && question.respostaCorreta === option.id;
              const isWrong =
                showCorrectAnswers &&
                isSelected &&
                answers[currentQuestion] !== question.respostaCorreta;

              return (
                <QuestionOption
                  key={option.id}
                  option={option}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  onSelect={saveAnswer}
                  showCorrectAnswers={showCorrectAnswers}
                />
              );
            })}
          </RadioGroup>

          {/* Explicação da questão */}
          {showCorrectAnswers && question.explicacao && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Explicação:
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {question.explicacao}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-0">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          {currentQuestion < normalizedQuestions.length - 1 ? (
            <Button onClick={nextQuestion} className="w-full sm:w-auto">
              Próxima
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finishQuiz} className="w-full sm:w-auto">
              Finalizar
              <Flag className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question Navigation */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Navegação Rápida</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {normalizedQuestions.map((_, index) => (
            <NavigationButton
              key={index}
              index={index}
              currentQuestion={currentQuestion}
              hasAnswer={!!answers[index]}
              onClick={() => handleNavigationClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
