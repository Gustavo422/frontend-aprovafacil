import React from 'react';
import { Alerttitulo, Alertdescricao } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    AlertTriangle,
    ServerCrash,
    ShieldX,
    RefreshCcw,
    Home,
    ArrowLeft
} from 'lucide-react';
import { ErrorMessage, ErrorType, getErrorTypeFromStatus } from './error-message';
import Link from 'next/link';

interface ErrorDisplayProps {
    title?: string;
    message?: string;
    statusCode?: number;
    errorType?: ErrorType;
    onRetry?: () => void;
    showHomeButton?: boolean;
    showBackButton?: boolean;
    className?: string;
    compact?: boolean;
}

/**
 * A comprehensive error display component that can be used throughout the application
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    title,
    message,
    statusCode,
    errorType: propErrorType,
    onRetry,
    showHomeButton = true,
    showBackButton = false,
    className = '',
    compact = false
}) => {
    // Determine error type based on status code if not provided
    const errorType = propErrorType || (statusCode ? getErrorTypeFromStatus(statusCode) : 'generic');

    // If compact, render a simple error message
    if (compact) {
        return (
            <div className={`space-y-4 ${className}`}>
                <ErrorMessage
                    type={errorType}
                    title={title}
                    message={message}
                />
                {onRetry && (
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Tentar novamente
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // Otherwise, render a more comprehensive error display
    return (
        <Card className={`w-full max-w-md mx-auto shadow-lg ${className}`}>
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    {errorType === 'server' && <ServerCrash className="h-8 w-8 text-red-600" />}
                    {errorType === 'auth' && <ShieldX className="h-8 w-8 text-red-600" />}
                    {(errorType === 'validation' || errorType === 'generic') && (
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    )}
                </div>
                <Alerttitulo className="text-xl">
                    {title || (errorType === 'server'
                        ? 'Erro no servidor'
                        : errorType === 'auth'
                            ? 'Erro de autenticação'
                            : 'Ocorreu um erro')}
                </Alerttitulo>
            </CardHeader>
            <CardContent>
                <Alertdescricao className="text-center">
                    {message || (errorType === 'server'
                        ? 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.'
                        : errorType === 'auth'
                            ? 'Suas credenciais são inválidas ou sua sessão expirou.'
                            : 'Ocorreu um erro inesperado. Por favor, tente novamente.')}
                </Alertdescricao>

                {statusCode && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Código de erro: {statusCode}
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                    {onRetry && (
                        <Button
                            variant="default"
                            onClick={onRetry}
                            className="flex items-center gap-2 flex-1"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Tentar novamente
                        </Button>
                    )}

                    {showHomeButton && (
                        <Button
                            variant={onRetry ? "outline" : "default"}
                            asChild
                            className="flex items-center gap-2 flex-1"
                        >
                            <Link href="/">
                                <Home className="h-4 w-4" />
                                Página inicial
                            </Link>
                        </Button>
                    )}
                </div>

                {showBackButton && (
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 w-full"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};