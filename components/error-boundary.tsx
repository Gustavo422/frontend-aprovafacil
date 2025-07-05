'use client';

import React from 'react';
import { logger } from '@/lib/logger';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

// Componente funcional separado para usar hooks
function ErrorFallbackComponent({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const { toast } = useToast();

  const handleReset = () => {
    resetError();
    toast({
      title: 'Página recarregada',
      description: 'A página foi recarregada com sucesso.',
    });
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    const errorMessage = `Erro: ${error.message}\nStack: ${error.stack}`;
    logger.error('Erro reportado', { errorMessage });

    toast({
      title: 'Erro reportado',
      description:
        'O erro foi registrado para análise. Obrigado pelo feedback!',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
          <CardDescription className="text-sm">
            Ocorreu um erro inesperado. Não se preocupe, nossa equipe foi
            notificada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || 'Erro desconhecido'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleReset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>

            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>

            <Button
              variant="ghost"
              onClick={handleReportError}
              className="w-full"
            >
              <Bug className="mr-2 h-4 w-4" />
              Reportar Erro
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Se o problema persistir, entre em contato com nosso suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary capturou um erro', {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
    this.setState({ error, errorInfo });

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      return (
        <ErrorFallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary, ErrorFallbackComponent as DefaultErrorFallback };
