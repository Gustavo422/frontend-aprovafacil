import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: 'always',
      },
      mutations: {
        networkMode: 'always',
      },
    },
    });
    // Padrões moved para query-client.ts (Providers)
    return client;
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 



