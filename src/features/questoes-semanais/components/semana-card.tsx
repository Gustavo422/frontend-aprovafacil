'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LockClosedIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  PlayIcon,
  TrophyIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export type SemanaStatus = 'concluida' | 'atual' | 'proxima' | 'bloqueada';

export interface SemanaCardProps {
  numeroSemana: number;
  status: SemanaStatus;
  onClick?: (numeroSemana: number) => void;
  dadosConclusao?: {
    questoesRespondidas: number;
    questoesAcertadas: number;
    totalQuestoes: number;
  };
  countdown?: {
    dias: number;
    horas: number;
    minutos: number;
  };
}

export function SemanaCard({ 
  numeroSemana, 
  status, 
  onClick, 
  dadosConclusao,
  countdown 
}: SemanaCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (status === 'concluida') {
      setIsFlipped(!isFlipped);
    } else if (onClick) {
      onClick(numeroSemana);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'concluida':
        return <TrophyIcon className="h-6 w-6" />;
      case 'atual':
        return <PlayIcon className="h-6 w-6" />;
      case 'proxima':
        return <ClockIcon className="h-6 w-6" />;
      case 'bloqueada':
        return <LockClosedIcon className="h-6 w-6" />;
      default:
        return <CalendarIcon className="h-6 w-6" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'atual':
        return 'Semana Atual';
      case 'proxima':
        return 'Próxima';
      case 'bloqueada':
        return 'Bloqueada';
      default:
        return 'Semana';
    }
  };

  const getIconColor = () => {
    switch (status) {
      case 'concluida':
        return 'text-destructive';
      case 'atual':
        return 'text-primary';
      case 'proxima':
        return 'text-yellow-500';
      case 'bloqueada':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getIconBg = () => {
    switch (status) {
      case 'concluida':
        return 'bg-destructive/10';
      case 'atual':
        return 'bg-primary/10';
      case 'proxima':
        return 'bg-yellow-50/30 border border-yellow-200/20';
      case 'bloqueada':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card 
      className={`card-hover cursor-pointer group h-full transition-all duration-300 ${
        isFlipped ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="text-center space-y-8 p-8">
        {/* Ícone com cor baseada no status */}
        <div className={`mx-auto w-12 h-12 ${getIconBg()} rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
          <div className={getIconColor()}>
            {getIcon()}
          </div>
        </div>
        
        {/* Conteúdo do Card */}
        <div className="space-y-2">
          <CardTitle className="text-lg">
            Semana {numeroSemana}
          </CardTitle>
          
          {/* Conteúdo baseado no status */}
          {!isFlipped ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {getStatusText()}
              </p>
              
              {/* Countdown para próxima semana */}
              {status === 'proxima' && countdown && (
                <div className="text-xs text-warning font-medium">
                  Desbloqueia em: {countdown.dias}d {countdown.horas}h {countdown.minutos}m
                </div>
              )}
              
              {/* Estatísticas para semana atual */}
              {status === 'atual' && (
                <div className="text-xs text-primary font-medium">
                  50 questões disponíveis
                </div>
              )}
            </div>
          ) : (
            /* Conteúdo do flip para semanas concluídas */
            status === 'concluida' && dadosConclusao && (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">
                  Semana Concluída
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Respondidas: {dadosConclusao.questoesRespondidas}/{dadosConclusao.totalQuestoes}</div>
                  <div>Acertos: {dadosConclusao.questoesAcertadas}/{dadosConclusao.totalQuestoes}</div>
                  <div className="text-destructive font-medium">
                    {Math.round((dadosConclusao.questoesAcertadas / dadosConclusao.totalQuestoes) * 100)}% de aproveitamento
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </CardHeader>
      

    </Card>
  );
}
