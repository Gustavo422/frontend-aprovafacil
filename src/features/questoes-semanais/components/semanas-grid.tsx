'use client';

import { SemanaCard, type SemanaStatus } from './semana-card';

interface SemanasGridProps {
  semanaAtual: number;
  onSemanaClick?: (numeroSemana: number) => void;
  dadosConclusao?: Record<number, {
    questoesRespondidas: number;
    questoesAcertadas: number;
    totalQuestoes: number;
  }>;
}

export function SemanasGrid({ 
  semanaAtual, 
  onSemanaClick,
  dadosConclusao = {}
}: SemanasGridProps) {
  
  // Gerar 50 semanas hardcoded - SEM DEPENDÊNCIAS EXTERNAS
  const semanas = [];
  
  for (let i = 1; i <= 50; i++) {
    let status: SemanaStatus;
    
    if (i < semanaAtual) {
      status = 'concluida';
    } else if (i === semanaAtual) {
      status = 'atual';
    } else if (i === semanaAtual + 1) {
      status = 'proxima';
    } else {
      status = 'bloqueada';
    }
    
    semanas.push({
      numeroSemana: i,
      status,
      dadosConclusao: dadosConclusao[i],
      countdown: i === semanaAtual + 1 ? {
        dias: 3,
        horas: 12,
        minutos: 30
      } : undefined
    });
  }

  const handleSemanaClick = (numeroSemana: number) => {
    if (onSemanaClick) {
      onSemanaClick(numeroSemana);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {semanas.map((semana) => (
        <SemanaCard
          key={semana.numeroSemana}
          numeroSemana={semana.numeroSemana}
          status={semana.status}
          onClick={handleSemanaClick}
          dadosConclusao={semana.dadosConclusao}
          countdown={semana.countdown}
        />
      ))}
    </div>
  );
}
