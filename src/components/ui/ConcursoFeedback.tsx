import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface para configuração do feedback de concurso
 */
interface ConcursoFeedbackProps {
  concursoId: string;
  concursoName: string;
  isChanging?: boolean;
  onComplete?: () => void;
  className?: string;
}

/**
 * Componente de notificação de mudança de concurso
 */
export const ConcursoChangeNotification: React.FC<ConcursoFeedbackProps> = ({
  concursoName,
  isChanging = false,
  onComplete,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (isChanging) {
      setIsVisible(true);
      setProgress(0);
      
      // Simular progresso
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsVisible(false);
              onComplete?.();
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isChanging, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 bg-white border border-blue-200 rounded-lg shadow-lg p-4 min-w-80',
      'transform transition-all duration-300',
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      className
    )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Mudando para {concursoName}
          </p>
          <p className="text-xs text-gray-500">
            Atualizando conteúdo...
          </p>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress}% concluído
        </p>
      </div>
    </div>
  );
};

/**
 * Componente de indicador de concurso ativo
 */
export const ConcursoIndicator: React.FC<{
  concursoName: string;
  isActive?: boolean;
  className?: string;
}> = ({ concursoName, isActive = true, className }) => {
  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      isActive 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200',
      className
    )}
    >
      <div className={cn(
        'w-2 h-2 rounded-full mr-2',
        isActive ? 'bg-green-500' : 'bg-gray-400'
      )}
      />
      <span>{concursoName}</span>
      {isActive && (
        <span className="ml-2 text-xs">Ativo</span>
      )}
    </div>
  );
};

/**
 * Componente de toast para mudança de concurso
 */
export const ConcursoToast: React.FC<{
  concursoName: string;
  message?: string;
  type?: 'success' | 'info' | 'warning';
  onClose?: () => void;
  duration?: number;
  className?: string;
}> = ({ 
  concursoName, 
  message = 'Concurso alterado com sucesso!', 
  type = 'success',
  onClose,
  duration = 3000,
  className 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const typeIcons = {
    success: (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 transform transition-all duration-300',
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      className
    )}
    >
      <div className={cn(
        'border rounded-lg p-4 shadow-lg max-w-sm',
        typeStyles[type]
      )}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {typeIcons[type]}
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {concursoName}
            </p>
            <p className="text-sm mt-1">
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de overlay de carregamento para mudança de concurso
 */
export const ConcursoLoadingOverlay: React.FC<{
  concursoName: string;
  isVisible: boolean;
  className?: string;
}> = ({ concursoName, isVisible, className }) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm',
      className
    )}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-blue-600 mb-4">
            <svg className="animate-spin h-full w-full" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Mudando para {concursoName}
          </h3>
          
          <p className="text-sm text-gray-600">
            Carregando conteúdo específico do concurso...
          </p>
          
          <div className="mt-6">
            <div className="flex space-x-2 justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para gerenciar feedback de concurso
 */
export const useConcursoFeedback = () => {
  const [isChanging, setIsChanging] = React.useState(false);
  const [currentConcurso, setCurrentConcurso] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    concursoName: string;
    message: string;
    type: 'success' | 'info' | 'warning';
  }>>([]);

  const changeConcurso = React.useCallback(async (
    concursoId: string,
    concursoName: string,
    changeFunction: () => Promise<void>
  ) => {
    setIsChanging(true);
    setCurrentConcurso({ id: concursoId, name: concursoName });

    try {
      await changeFunction();
      
      // Adicionar toast de sucesso
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, {
        id: toastId,
        concursoName,
        message: 'Concurso alterado com sucesso!',
        type: 'success'
      }]);

      // Remover toast após 3 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      }, 3000);

    } catch {
      // Adicionar toast de erro
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, {
        id: toastId,
        concursoName,
        message: 'Erro ao alterar concurso. Tente novamente.',
        type: 'warning'
      }]);

      // Remover toast após 5 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      }, 5000);
    } finally {
      setIsChanging(false);
      setCurrentConcurso(null);
    }
  }, []);

  const removeToast = React.useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  return {
    isChanging,
    currentConcurso,
    toasts,
    changeConcurso,
    removeToast
  };
};

/**
 * Componente de gerenciador de feedback de concurso
 */
export const ConcursoFeedbackManager: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isChanging, currentConcurso, toasts, removeToast } = useConcursoFeedback();

  return (
    <>
      {children}
      
      {/* Loading overlay */}
      {currentConcurso && (
        <ConcursoLoadingOverlay
          concursoName={currentConcurso.name}
          isVisible={isChanging}
        />
      )}
      
      {/* Toasts */}
      {toasts.map((toast) => (
        <ConcursoToast
          key={toast.id}
          concursoName={toast.concursoName}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}; 