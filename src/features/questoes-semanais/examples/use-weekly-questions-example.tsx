import React from 'react';
import { useWeeklyQuestions } from '../hooks/use-weekly-questions';

/**
 * Exemplo prático de uso do hook useWeeklyQuestions
 * Este componente demonstra todas as funcionalidades disponíveis
 */
export function WeeklyQuestionsExample() {
  const {
    // Queries principais
    getAtual,
    getRoadmap,
    concluirSemana,
    
    // Estados agregados
    isLoading,
    isError,
    error,
    hasConcurso,
    concursoId,
  } = useWeeklyQuestions();

  // Estados de loading específicos
  const isLoadingAtual = getAtual.isLoading;
  const isLoadingRoadmap = getRoadmap.isLoading;
  const isConcluindo = concluirSemana.isPending;

  // Dados das queries
  const semanaAtual = getAtual.data;
  const roadmap = getRoadmap.data;

  // Função para concluir uma semana
  const handleConcluirSemana = (numeroSemana: number) => {
    const respostas = [
      {
        questao_id: 'questao-1',
        resposta_selecionada: 2,
        tempo_segundos: 45,
      },
      {
        questao_id: 'questao-2',
        resposta_selecionada: 1,
        tempo_segundos: 30,
      },
    ];

    concluirSemana.mutate({
      numero_semana: numeroSemana,
      respostas,
      pontuacao: 80, // Será calculado pelo backend
      tempo_minutos: 15,
    });
  };

  // Renderização condicional baseada no estado
  if (!hasConcurso) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Selecione um Concurso
        </h2>
        <p className="text-gray-500">
          Para acessar as questões semanais, selecione um concurso primeiro.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando questões semanais...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-red-600">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          <button
            onClick={() => {
              getAtual.refetch();
              getRoadmap.refetch();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header com informações do concurso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          Questões Semanais
        </h1>
        <p className="text-blue-700">
          Concurso: <span className="font-semibold">{concursoId}</span>
        </p>
      </div>

      {/* Semana Atual */}
      {semanaAtual && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Semana Atual
          </h2>
          
          {semanaAtual.questao_semanal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {semanaAtual.questao_semanal.titulo}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Semana {semanaAtual.questao_semanal.numero_semana} • 
                    {semanaAtual.questao_semanal.ano}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Modo</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {semanaAtual.status.modo_desbloqueio}
                  </p>
                </div>
              </div>

              {/* Countdown para modo strict */}
              {semanaAtual.status?.modo_desbloqueio === 'strict' && 
               semanaAtual.status?.tempo_restante && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⏰ Tempo restante: {Math.floor(semanaAtual.status.tempo_restante / 3600)}h 
                    {Math.floor((semanaAtual.status.tempo_restante % 3600) / 60)}m
                  </p>
                </div>
              )}

              {/* Questões */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Questões ({semanaAtual.questoes.length})
                </h4>
                {semanaAtual.questoes.map((questao, index) => (
                  <div key={questao.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Q{index + 1}:</span> {questao.enunciado}
                    </p>
                    <div className="text-xs text-gray-500">
                      {questao.disciplina} • {questao.assunto} • {questao.nivel_dificuldade}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão de conclusão */}
              <button
                onClick={() => handleConcluirSemana(semanaAtual.questao_semanal!.numero_semana)}
                disabled={isConcluindo}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConcluindo ? 'Concluindo...' : 'Concluir Semana'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma semana disponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* Roadmap */}
      {roadmap && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Roadmap das Semanas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmap.map((item) => (
              <div
                key={item.numero_semana}
                className={`p-4 rounded-lg border-2 ${
                  item.status === 'done'
                    ? 'border-green-200 bg-green-50'
                    : item.status === 'current'
                    ? 'border-blue-200 bg-blue-50'
                    : item.status === 'locked'
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    Semana {item.numero_semana}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'done'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'current'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'locked'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.status === 'done' && '✓ Concluída'}
                    {item.status === 'current' && '🔄 Atual'}
                    {item.status === 'locked' && '🔒 Bloqueada'}
                    {item.status === 'available' && '✨ Disponível'}
                  </span>
                </div>

                {item.titulo && (
                  <p className="text-sm text-gray-600 mb-2">{item.titulo}</p>
                )}

                {item.status === 'locked' && item.liberaEm && (
                  <p className="text-xs text-gray-500">
                    Libera em: {new Date(item.liberaEm).toLocaleDateString()}
                  </p>
                )}

                {item.progresso && item.progresso.concluido && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      Pontuação: <span className="font-medium">{item.progresso.pontuacao}</span>
                    </p>
                    <p className="text-gray-600">
                      Tempo: <span className="font-medium">{item.progresso.tempo_minutos}min</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {semanaAtual?.historico && semanaAtual.historico.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Histórico de Conclusões
          </h2>
          
          <div className="space-y-3">
            {semanaAtual.historico.map((progresso) => (
              <div key={progresso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Semana {progresso.numero_semana}
                  </p>
                  <p className="text-sm text-gray-500">
                    Concluída em {new Date(progresso.concluido_em).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{progresso.pontuacao}%</p>
                  <p className="text-sm text-gray-500">{progresso.tempo_minutos}min</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback de conclusão */}
      {concluirSemana.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <p className="text-green-800 font-medium">
            ✅ Semana concluída com sucesso!
          </p>
        </div>
      )}

      {concluirSemana.isError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 font-medium">
            ❌ Erro ao concluir semana: {concluirSemana.error?.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default WeeklyQuestionsExample;
