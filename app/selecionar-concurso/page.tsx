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
          
          if (preference.preferences && preference.preferences.length > 0) {
            console.log('[DEBUG] Usuário já tem concurso selecionado, redirecionando para página inicial');
            setCheckStatus('Concurso já selecionado, redirecionando...');
            window.location.href = '/';
            return;
          }
        }

        console.log('[DEBUG] Nenhuma preferência encontrada, mostrando seletor');
        setIsChecking(false);
      } catch (error) {
        console.error('[DEBUG] Erro ao verificar preferência:', error);
        setIsChecking(false);
      }
    };

    checkConcursoPreference();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{checkStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <ConcursoProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Selecione seu Concurso
              </h1>
              <p className="text-muted-foreground">
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



