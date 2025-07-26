'use client';

import { useEffect, useState } from 'react';
import { ConcursoSelector } from '@/components/onboarding/ConcursoSelector';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

export default function SelecionarConcursoPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [checkStatus, setCheckStatus] = useState<string>('Verificando preferência de concurso...');

  useEffect(() => {
    const checkConcursoPreference = async () => {
      try {
        console.log('[DEBUG] Verificando preferência de concurso na página...');
        setCheckStatus('Verificando autenticação...');
        
        // Verificar se há token
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        if (!token) {
          console.log('[DEBUG] Token não encontrado, redirecionando para login');
          setCheckStatus('Token não encontrado, redirecionando...');
          window.location.href = '/login';
          return;
        }

        setCheckStatus('Verificando preferência de concurso...');
        
        // Verificar preferência de concurso
        const response = await fetch('/api/user/concurso-preference', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('[DEBUG] Resposta da API:', response.status);

        if (response.ok) {
          const preference = await response.json();
          console.log('[DEBUG] Preferência encontrada:', preference);
          
          // Se há uma preferência válida, redirecionar para dashboard
          if (preference && preference.data && preference.data.concurso_id) {
            console.log('[DEBUG] Preferência válida encontrada, redirecionando para dashboard');
            setCheckStatus('Preferência encontrada, redirecionando...');
            window.location.href = '/dashboard';
            return;
          }
        } else if (response.status === 404) {
          console.log('[DEBUG] Nenhuma preferência encontrada (404)');
          setCheckStatus('Nenhuma preferência encontrada, mostrando seletor...');
        } else {
          console.log('[DEBUG] Erro na API:', response.status);
          setCheckStatus('Erro ao verificar preferência, mostrando seletor...');
        }

        console.log('[DEBUG] Nenhuma preferência válida, mostrando seletor');
        setIsChecking(false);
      } catch (error) {
        console.error('[DEBUG] Erro ao verificar preferência:', error);
        setCheckStatus('Erro na verificação, mostrando seletor...');
        setIsChecking(false);
      }
    };

    checkConcursoPreference();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{checkStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <ConcursoProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Selecione seu Concurso
              </h1>
              <p className="text-gray-600">
                Escolha o concurso para o qual você está estudando para personalizar sua experiência.
              </p>
            </div>
            <ConcursoSelector />
          </div>
        </div>
      </div>
    </ConcursoProvider>
  );
} 



