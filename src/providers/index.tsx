'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from './query-client';
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { setupQueryPersistence } from './query-persistence';
import { logger } from '@/lib/logger';
import { reportNavigationTimings, startMetricsReporter, recordQueryError, recordQuerySuccess } from '@/src/features/simulados/lib/metrics';

type Props = {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, string>;
};

export function Providers({ children, locale = 'pt-BR', messages = {} }: Props) {
  // Feedback global básico em sucesso/erro
  useEffect(() => {
    // Hidratar/persistir queries de simulados no localStorage
    setupQueryPersistence(queryClient);
    // Coletar métricas de navegação e iniciar reporter
    reportNavigationTimings();
    startMetricsReporter();

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event) return;
      const type = (event as any).type as string | undefined;
      const query = (event as any).query;
      if (type !== 'queryUpdated' || !query) return;

      const status = query.state?.status as string | undefined;
      const meta = (query.options?.meta ?? {}) as Record<string, unknown>;
      const endpoint = meta.endpoint as string | undefined;
      const params = meta.params as Record<string, unknown> | undefined;
      const correlationId = meta.correlationId as string | undefined;

      if (status === 'error') {
        const err = query.state.error as Error | undefined;
        logger.error('RQ error', { endpoint, params, correlationId, message: err?.message });
        recordQueryError(endpoint);
        if (process.env.NODE_ENV === 'development' && err?.message) {
          toast({ title: 'Erro ao carregar dados', description: err.message, variant: 'destructive' });
        }
      } else if (status === 'success') {
        logger.info('RQ success', { endpoint, params, correlationId });
        recordQuerySuccess(endpoint);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
            />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
