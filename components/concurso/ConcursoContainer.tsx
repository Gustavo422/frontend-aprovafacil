import type { ReactNode } from 'react';
import React from 'react';
import { useConcurso } from '@/contexts/ConcursoContext';
import { ConcursoErrorMessage } from './ConcursoErrorMessage';
import { Loader2 } from 'lucide-react';

interface ConcursoContainerProps {
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  showFullErrorDisplay?: boolean;
}

export const ConcursoContainer: React.FC<ConcursoContainerProps> = ({
  children,
  className = '',
  loadingMessage = 'Carregando informações do concurso...',
}) => {
  const { state, loadUserPreference } = useConcurso();
  const { isLoading, error } = state;
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      {error ? (
        <ConcursoErrorMessage 
          error="Erro ao carregar dados do concurso" 
          className="my-4" 
          onRetry={async () => loadUserPreference()} 
        />
      ) : (
        children
      )}
    </div>
  );
};