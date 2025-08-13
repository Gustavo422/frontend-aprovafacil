import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createServerQueryClient } from '@/src/providers/create-server-query-client';
import { simuladosKeys } from '@/src/providers/query-client';
import { getSimuladoBySlug, getQuestoesBySlug, getProgressoBySlug } from '@/src/features/simulados/api/fetchers';
import ClientPage from './ClientPage';

export default async function SimuladoBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const queryClient = createServerQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: simuladosKeys.detail(slug), queryFn: () => getSimuladoBySlug(slug) }),
    queryClient.prefetchQuery({ queryKey: simuladosKeys.questoes(slug), queryFn: () => getQuestoesBySlug(slug) }),
    queryClient.prefetchQuery({ queryKey: simuladosKeys.progresso(slug), queryFn: () => getProgressoBySlug(slug) }),
  ]);

  const dehydratedState = dehydrate(queryClient, {
    shouldDehydrateQuery: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'simulados',
  });

  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientPage slug={slug} />
    </HydrationBoundary>
  );
}