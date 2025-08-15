'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { QuestoesSemanaisHeader } from './questoes-semanais-header';
import { SemanasGrid } from './semanas-grid';

/**
 * Página principal de questões semanais - COMPLETAMENTE HARDCODED
 * Usa a mesma paleta de cores e estilo dos cards da página inicial
 */
export function QuestoesSemanaisPage() {
  // Estado local simples - semana atual hardcoded
  const [semanaAtual, setSemanaAtual] = useState(3);
  
  // Dados hardcoded para demonstração
  const dadosConclusao = {
    1: { questoesRespondidas: 45, questoesAcertadas: 38, totalQuestoes: 50 },
    2: { questoesRespondidas: 42, questoesAcertadas: 35, totalQuestoes: 50 }
  };

  const handleSemanaClick = (numeroSemana: number) => {
    if (numeroSemana === semanaAtual) {
      alert(`Você está na Semana ${numeroSemana}. Esta é sua semana atual.`);
    } else if (numeroSemana < semanaAtual) {
      alert(`Semana ${numeroSemana} já foi concluída!`);
    } else if (numeroSemana === semanaAtual + 1) {
      alert(`Semana ${numeroSemana} será desbloqueada em breve!`);
    } else {
      alert(`Semana ${numeroSemana} está bloqueada. Complete as semanas anteriores primeiro.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header da página */}
      <QuestoesSemanaisHeader concursoId="demo" />

      <div className="container-padding py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Progresso Global Hardcoded */}
          <Card className="p-8">
            <div className="text-center space-y-8">
              <h2 className="text-3xl font-bold">Progresso Global</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {semanaAtual - 1} de 50 semanas concluídas
              </p>
              
              {/* Barra de progresso */}
              <div className="w-full max-w-md mx-auto bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round(((semanaAtual - 1) / 50) * 100)}%` }}
                ></div>
              </div>
              
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">
                  {Math.round(((semanaAtual - 1) / 50) * 100)}%
                </span>
                <span className="text-muted-foreground ml-2">concluído</span>
              </div>
            </div>
          </Card>

          {/* Grid das Semanas Hardcoded */}
          <div className="space-y-8">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">Jornada das Questões Semanais</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sua semana atual: <span className="font-semibold text-primary">Semana {semanaAtual}</span>
              </p>
            </div>
            
            <SemanasGrid
              semanaAtual={semanaAtual}
              onSemanaClick={handleSemanaClick}
              dadosConclusao={dadosConclusao}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
