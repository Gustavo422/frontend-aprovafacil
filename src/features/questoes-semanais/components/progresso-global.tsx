'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

interface ProgressoGlobalProps {
  semanaAtual?: {
    status?: {
      semana_atual?: number;
    };
  };
  roadmap?: Array<{
    status?: string;
  }>;
}

export function ProgressoGlobal({ semanaAtual, roadmap }: ProgressoGlobalProps) {
  if (!roadmap || !semanaAtual || !semanaAtual.status) {
    return null;
  }

  // Calcular estatísticas baseado no roadmap
  const totalSemanas = roadmap.length;
  const semanasConcluidas = roadmap.filter(item => 
    item.status === 'concluida' || item.status === 'done' || item.status === 'completed'
  ).length;
  const semanaAtualNum = semanaAtual.status.semana_atual || 1;
  const percentualConcluido = Math.round((semanasConcluidas / totalSemanas) * 100);
  const semanasRestantes = totalSemanas - semanasConcluidas;

  // Determinar status geral
  const getStatusColor = () => {
    if (percentualConcluido >= 80) return 'text-green-600';
    if (percentualConcluido >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (percentualConcluido >= 80) return 'bg-green-500';
    if (percentualConcluido >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300">
      {/* Header com título e estatísticas rápidas */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Progresso Global
            </h2>
            <p className="text-gray-600">Acompanhe sua jornada de preparação</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {semanasConcluidas}/{totalSemanas}
          </div>
          <div className="text-sm text-gray-600">Semanas Concluídas</div>
        </div>
      </div>

      {/* Barra de progresso principal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-gray-700">
            {percentualConcluido}% concluído
          </span>
          <span className="text-lg font-semibold text-gray-500">
            Falta {semanasRestantes} semanas
          </span>
        </div>
        
        {/* Barra de progresso simples */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
              style={{ width: `${percentualConcluido}%` }}
            />
          </div>
          
          {/* Indicador de progresso flutuante */}
          <div 
            className="absolute top-0 transform -translate-y-1 -translate-x-1/2 transition-all duration-1000 ease-out"
            style={{ left: `${Math.min(percentualConcluido, 95)}%` }}
          >
            <div className="bg-white border-2 border-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {semanaAtualNum}
          </div>
          <div className="text-sm text-blue-600">Semana Atual</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {semanasConcluidas}
          </div>
          <div className="text-sm text-green-600">Concluídas</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {semanasRestantes}
          </div>
          <div className="text-sm text-yellow-600">Restantes</div>
        </div>
      </div>

      {/* Mensagem motivacional */}
      <div className="mt-6 text-center">
        <p className={`text-lg font-medium ${getStatusColor()}`}>
          {percentualConcluido >= 80 ? '🎉 Excelente progresso! Você está quase lá!' :
           percentualConcluido >= 50 ? '🚀 Continue assim! Metade do caminho já foi percorrida!' :
           '💪 Vamos começar! Cada semana é um passo em direção ao seu objetivo!'}
        </p>
      </div>
    </div>
  );
}
