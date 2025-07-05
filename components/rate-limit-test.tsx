'use client';
import { logger } from '@/lib/logger';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthRetry } from '@/hooks/use-auth-retry';
import { useToast } from '@/features/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function RateLimitTest() {
  const [isLoading, setIsLoading] = useState(false);
  const { retryWithBackoff, getRateLimitMessage, isRetrying } = useAuthRetry();
  const { toast } = useToast();

  // Função que simula um erro de rate limit
  const simulateRateLimitError = async () => {
    return {
      error: {
        message: 'Request rate limit reached',
        status: 429,
      },
    };
  };

  const testRateLimitHandling = async () => {
    setIsLoading(true);
    try {
      const result = await retryWithBackoff(
        async () => {
          return await simulateRateLimitError();
        },
        {
          onRetry: (attempt, delay) => {
            toast({
              title: 'Teste de Rate Limit',
              description: `Tentativa ${attempt}: Aguardando ${Math.round(delay / 1000)}s...`,
            });
          },
        }
      );

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro simulado',
          description: result.error.message,
        });
      }
    } catch (error: unknown) {
      logger.error('Erro no teste:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no teste',
        description: getRateLimitMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Teste de Rate Limit</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Este componente testa o tratamento de rate limits. Clique no botão
          para simular um erro de rate limit.
        </p>
        <Button
          onClick={testRateLimitHandling}
          disabled={isLoading || isRetrying}
          className="w-full"
        >
          {isRetrying
            ? 'Aguardando...'
            : isLoading
              ? 'Testando...'
              : 'Testar Rate Limit'}
        </Button>
        {isRetrying && (
          <p className="text-sm text-muted-foreground mt-2">
            Simulando retry com backoff exponencial...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
