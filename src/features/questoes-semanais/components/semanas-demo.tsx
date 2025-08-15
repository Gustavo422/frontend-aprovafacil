'use client';

import { useState } from 'react';
import { SemanasGrid } from './semanas-grid';

export function SemanasDemo() {
  const [semanaAtual, setSemanaAtual] = useState(3);

  const handleSemanaClick = (numeroSemana: number) => {
    console.log(`Semana ${numeroSemana} clicada`);
    
    // Simular mudança de semana para demonstração
    if (numeroSemana === semanaAtual) {
      alert(`Você está na Semana ${numeroSemana}. Clique em "Concluir Semana" para avançar.`);
    } else if (numeroSemana < semanaAtual) {
      alert(`Semana ${numeroSemana} já foi concluída!`);
    } else if (numeroSemana === semanaAtual + 1) {
      alert(`Semana ${numeroSemana} será desbloqueada em breve!`);
    } else {
      alert(`Semana ${numeroSemana} está bloqueada. Complete as semanas anteriores primeiro.`);
    }
  };

  const avancarSemana = () => {
    if (semanaAtual < 50) {
      setSemanaAtual(semanaAtual + 1);
    }
  };

  const voltarSemana = () => {
    if (semanaAtual > 1) {
      setSemanaAtual(semanaAtual - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header de Demonstração */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Demonstração do Sistema de Semanas
          </h1>
          <p className="text-gray-600 mb-6">
            Este é o novo design dashboard fintech com 50 semanas hardcoded
          </p>
          
          {/* Controles de Demonstração */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={voltarSemana}
              disabled={semanaAtual <= 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬅️ Semana Anterior
            </button>
            
            <div className="px-6 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
              Semana Atual: {semanaAtual}
            </div>
            
            <button
              onClick={avancarSemana}
              disabled={semanaAtual >= 50}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima Semana ➡️
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>💡 <strong>Dica:</strong> Clique nas semanas concluídas (vermelhas) para ver o flip animation!</p>
            <p>🎮 Use os botões acima para simular o progresso nas semanas</p>
          </div>
        </div>

        {/* Grid das Semanas */}
        <SemanasGrid
          semanaAtual={semanaAtual}
          onSemanaClick={handleSemanaClick}
          dadosConclusao={Object.fromEntries(
            Array.from({ length: semanaAtual - 1 }, (_, i) => [
              i + 1,
              {
                questoesRespondidas: Math.floor(Math.random() * 50) + 30,
                questoesAcertadas: Math.floor(Math.random() * 45) + 25,
                totalQuestoes: 50
              }
            ])
          )}
        />

        {/* Instruções de Uso */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📚 Como Usar o Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Estados dos Cards:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="font-medium text-red-600">🔴 Vermelho:</span> Semana concluída (clique para flip)</li>
                <li><span className="font-medium text-blue-600">🔵 Azul:</span> Semana atual (acesso direto)</li>
                <li><span className="font-medium text-yellow-600">🟡 Amarelo:</span> Próxima semana (countdown)</li>
                <li><span className="font-medium text-gray-600">⚫ Cinza:</span> Semanas bloqueadas</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">✨ Funcionalidades:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>🔄 <strong>Flip Animation:</strong> Clique nas semanas concluídas</li>
                <li>⏰ <strong>Countdown:</strong> Timer regressivo para próxima semana</li>
                <li>📊 <strong>Estatísticas:</strong> Dados de conclusão em cada card</li>
                <li>🎨 <strong>Design Responsivo:</strong> Adapta-se a todos os dispositivos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
