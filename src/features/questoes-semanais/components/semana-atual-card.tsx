'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { SemanaAtual, ConcluirSemanaInput } from '../hooks/use-weekly-questions';

interface SemanaAtualCardProps {
  data: SemanaAtual;
  onConcluir: (input: ConcluirSemanaInput) => void;
  isConcluindo: boolean;
}

export function SemanaAtualCard({ data, onConcluir, isConcluindo }: SemanaAtualCardProps) {
  // Todos os hooks devem vir ANTES de qualquer return condicional
  const [tempoRestante, setTempoRestante] = useState<number | undefined>(
    data.status?.tempo_restante
  );
  const [isPaused, setIsPaused] = useState(false);
  const [respostas, setRespostas] = useState<Array<{
    questao_id: string;
    resposta_selecionada: number;
    tempo_segundos: number;
  }>>([]);

  // Timer para modo strict - deve vir ANTES de qualquer return
  useEffect(() => {
    if (!data.status || !tempoRestante || data.status.modo_desbloqueio !== 'strict') return;

    if (isPaused) return;

    const interval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoRestante, isPaused, data.status]);

  // Verificação de segurança para evitar erro quando data.status for undefined
  if (!data.status) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="p-4 bg-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-bold text-yellow-900 mb-4">
          Status não disponível
        </h3>
        <p className="text-yellow-600 text-lg">
          Aguarde o carregamento completo dos dados da semana.
        </p>
      </div>
    );
  }

  // Formatar tempo restante
  const formatTempoRestante = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    }
    return `${segs}s`;
  };

  // Calcular pontuação baseada nas respostas
  const calcularPontuacao = () => {
    if (respostas.length === 0) return 0;
    
    const acertos = respostas.filter(r => r.tempo_segundos > 0).length;
    return Math.round((acertos / respostas.length) * 100);
  };

  // Calcular tempo total
  const calcularTempoTotal = () => {
    return respostas.reduce((total, r) => total + r.tempo_segundos, 0);
  };

  // Manipular resposta
  const handleResposta = (questaoId: string, alternativa: number, tempo: number) => {
    setRespostas(prev => {
      const existing = prev.find(r => r.questao_id === questaoId);
      if (existing) {
        return prev.map(r => 
          r.questao_id === questaoId 
            ? { ...r, resposta_selecionada: alternativa, tempo_segundos: tempo }
            : r
        );
      }
      return [...prev, { questao_id: questaoId, resposta_selecionada: alternativa, tempo_segundos: tempo }];
    });
  };

  // Concluir semana
  const handleConcluir = () => {
    const pontuacao = calcularPontuacao();
    const tempoMinutos = Math.round(calcularTempoTotal() / 60);
    
    onConcluir({
      numero_semana: data.questao_semanal!.numero_semana,
      respostas,
      pontuacao,
      tempo_minutos: tempoMinutos,
    });
  };

  if (!data.questao_semanal) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-all duration-300">
        <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Nenhuma semana disponível
        </h3>
        <p className="text-gray-600 text-lg mb-6">
          Aguarde a liberação da próxima semana ou entre em contato com o suporte.
        </p>
        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
          <ClockIcon className="h-5 w-5" />
          <span className="font-medium">Verifique novamente em breve</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300">
      {/* Header da semana com design melhorado */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {data.questao_semanal.titulo}
              </h2>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Semana {data.questao_semanal.numero_semana}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{data.questao_semanal.ano}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="capitalize">{data.status.modo_desbloqueio}</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Descrição da semana */}
          {data.questao_semanal.descricao && (
            <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
              {data.questao_semanal.descricao}
            </p>
          )}
        </div>
        
        {/* Countdown para modo strict com design visual */}
        {data.status.modo_desbloqueio === 'strict' && tempoRestante && (
          <div className="text-right ml-8">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-lg font-semibold text-yellow-800">
                  Tempo Restante
                </span>
              </div>
              
              <div className="text-4xl font-bold text-yellow-600 mb-4 font-mono">
                {formatTempoRestante(tempoRestante)}
              </div>
              
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-full px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-200"
              >
                {isPaused ? (
                  <>
                    <PlayIcon className="h-4 w-4 inline mr-2" />
                    Retomar
                  </>
                ) : (
                  <>
                    <PauseIcon className="h-4 w-4 inline mr-2" />
                    Pausar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questões com design melhorado */}
      <div className="space-y-8 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-full">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Questões ({data.questoes.length})
          </h3>
        </div>
        
        {data.questoes.map((questao, index) => {
          const resposta = respostas.find(r => r.questao_id === questao.id);
          const tempoResposta = resposta?.tempo_segundos || 0;
          
          return (
            <div key={questao.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    Questão {index + 1}
                  </h4>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {questao.disciplina} • {questao.assunto}
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">{questao.enunciado}</p>
              
              {/* Alternativas com design melhorado */}
              <div className="space-y-3 mb-6">
                {questao.alternativas.map((alternativa, altIndex) => (
                  <label
                    key={altIndex}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      resposta?.resposta_selecionada === altIndex
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`questao-${questao.id}`}
                      value={altIndex}
                      checked={resposta?.resposta_selecionada === altIndex}
                      onChange={() => handleResposta(questao.id, altIndex, tempoResposta)}
                      className="mr-4 text-blue-600 w-5 h-5"
                    />
                    <span className="text-gray-700 text-lg">{alternativa}</span>
                  </label>
                ))}
              </div>
              
              {/* Timer da questão e dificuldade */}
              <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Dificuldade: {questao.nivel_dificuldade}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Tempo: {Math.floor(tempoResposta / 60)}m {tempoResposta % 60}s</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo e conclusão com design melhorado */}
      <div className="border-t border-gray-200 pt-8">
        {/* Estatísticas da semana */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {respostas.filter(r => r.resposta_selecionada !== undefined).length}
            </div>
            <div className="text-sm font-medium text-blue-600">Respondidas</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700">
              {calcularPontuacao()}%
            </div>
            <div className="text-sm font-medium text-green-600">Pontuação</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
            <div className="p-3 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-700">
              {Math.round(calcularTempoTotal() / 60)}
            </div>
            <div className="text-sm font-medium text-yellow-600">Minutos</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {data.questoes.length}
            </div>
            <div className="text-sm font-medium text-purple-600">Total</div>
          </div>
        </div>
        
        {/* Botão de conclusão com design melhorado */}
        <div className="text-center">
          <button
            onClick={handleConcluir}
            disabled={isConcluindo || respostas.length === 0}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isConcluindo ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Concluindo...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-6 w-6" />
                <span>Concluir Semana</span>
              </>
            )}
          </button>
          
          {respostas.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Responda pelo menos uma questão para concluir a semana
            </p>
          )}
        </div>
      </div>
    </div>
  );
}