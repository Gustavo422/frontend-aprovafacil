'use client';

import { TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function ConcursoRequired() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Selecione um Concurso
          </h1>
          
          <p className="text-gray-600 mb-8">
            Para acessar as questões semanais, você precisa selecionar um concurso primeiro.
            Escolha o concurso que deseja estudar e comece sua jornada de preparação.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/selecionar-concurso"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <TrophyIcon className="h-5 w-5" />
              <span>Selecionar Concurso</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            
            <Link
              href="/dashboard"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Voltar ao Dashboard
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Por que selecionar um concurso?
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>• Acesso às questões específicas do concurso</div>
              <div>• Cronograma personalizado de estudos</div>
              <div>• Acompanhamento do seu progresso</div>
              <div>• Conteúdo direcionado para sua preparação</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
