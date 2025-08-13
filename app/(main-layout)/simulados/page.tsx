'use client';
import React from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { simuladosKeys } from '@/src/providers/query-client';
import { getSimuladoBySlug, getQuestoesBySlug } from '@/src/features/simulados/api/fetchers';
import { logger } from '@/lib/logger';
import { useConcurso } from '@/contexts/ConcursoContext';
import { useListarSimulados } from '@/src/features/simulados/hooks/use-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { SimuladoCard } from '@/src/features/simulados/components/SimuladoCard';

import type { Simulado as SimuladoType, PaginatedSimulados } from '@/src/features/simulados';

export default function SimuladosPage() {
  const queryClient = useQueryClient();
  const { activeConcursoId, hasSelectedConcurso } = useConcurso();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(9);
  const [search, setSearch] = React.useState<string>('');
  const [openSuggestions, setOpenSuggestions] = React.useState<boolean>(false);
  const [statusFilter, setStatusFilter] = React.useState<
    'finalizado' | 'em_andamento' | 'nao_iniciado' | undefined
  >(undefined);

  const query = useListarSimulados({ page, limit, search: search || undefined, status: statusFilter });
  const data = query.data as PaginatedSimulados | undefined;
  const simulados = (data?.items ?? []) as SimuladoType[];
  const isLoading = query.isLoading;
  const error = query.error as Error | null | undefined;
  const pagination = data?.pagination;

  // Resetar para página 1 quando filtros/busca mudarem
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Fuzzy index (client-side) sobre os títulos retornados
  const fuse = React.useMemo(() => new Fuse(simulados ?? [], {
    keys: ['titulo'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [simulados]);

  const suggestions = React.useMemo(() => {
    const q = search.trim();
    if (!q) return [] as typeof simulados;
    const results = fuse.search(q).map(r => r.item);
    // Limitar sugestões
    return results.slice(0, 8);
  }, [search, fuse]);

  // Hydration-safe placeholder antes de usar estados do browser/cliente
  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  // Loading state (após montagem)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Erro ao buscar simulados', {
      error: error instanceof Error ? error.message : String(error),
      concursoId: activeConcursoId,
    });
    
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar simulados. Tente novamente.</p>
        </div>
      </div>
    );
  }

  // No concurso selected state
  if (!hasSelectedConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar os simulados disponíveis.
          </p>
        </div>
      </div>
    );
  }

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil':
        return 'bg-green-100 text-green-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'dificil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDificuldadeText = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil':
        return 'Fácil';
      case 'medio':
        return 'Médio';
      case 'dificil':
        return 'Difícil';
      default:
        return 'Não definido';
    }
  };

  const prefetchSlug = async (slug: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: simuladosKeys.detail(slug, activeConcursoId),
        queryFn: () => getSimuladoBySlug(slug, activeConcursoId),
        staleTime: 30_000,
      }),
      queryClient.prefetchQuery({
        queryKey: simuladosKeys.questoes(slug, activeConcursoId),
        queryFn: () => getQuestoesBySlug(slug, activeConcursoId),
        staleTime: 30_000,
      }),
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
          <p className="text-muted-foreground">
            Teste seus conhecimentos com simulados específicos para seu concurso.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <div className="relative w-full">
            <Input
              placeholder="Buscar simulado por título..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpenSuggestions(true); }}
              onFocus={() => setOpenSuggestions(true)}
              onBlur={() => setTimeout(() => setOpenSuggestions(false), 150)}
            />
            {openSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
                <ul className="max-h-64 overflow-auto">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <Link className="block px-3 py-2 hover:bg-muted" href={`/simulados/${s.slug}`}>
                        {s.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading sutil quando dados podem estar desatualizados */}
      {query.isStale && (
        <div className="text-xs text-muted-foreground">Carregando atualizações…</div>
      )}

      {/* Filtros de status (selecionável no mobile) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por status:</span>
        {/* Desktop: botões */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <Button size="sm" variant={statusFilter === undefined ? 'default' : 'outline'} onClick={() => setStatusFilter(undefined)}>Todos</Button>
          <Button size="sm" variant={statusFilter === 'finalizado' ? 'default' : 'outline'} onClick={() => setStatusFilter('finalizado')}>Finalizados</Button>
          <Button size="sm" variant={statusFilter === 'em_andamento' ? 'default' : 'outline'} onClick={() => setStatusFilter('em_andamento')}>Em andamento</Button>
          <Button size="sm" variant={statusFilter === 'nao_iniciado' ? 'default' : 'outline'} onClick={() => setStatusFilter('nao_iniciado')}>Não iniciados</Button>
        </div>
        {/* Mobile: select compacto */}
        <div className="md:hidden w-full max-w-[220px]">
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={statusFilter ?? ''}
            onChange={(e) => {
              const v = e.target.value as '' | 'finalizado' | 'em_andamento' | 'nao_iniciado';
              setStatusFilter(v === '' ? undefined : v);
            }}
          >
            <option value="">Todos</option>
            <option value="finalizado">Finalizados</option>
            <option value="em_andamento">Em andamento</option>
            <option value="nao_iniciado">Não iniciados</option>
          </select>
        </div>
      </div>

      {/* Contador X–Y de Z */}
      <div className="text-sm text-muted-foreground">
        {(() => {
          const total = pagination?.total;
          if (typeof total === 'number') {
            const start = (page - 1) * limit + 1;
            const end = Math.max(start - 1, start + simulados.length - 1);
            return <>Mostrando {simulados.length > 0 ? `${start}–${end}` : 0} de {total}</>;
          }
          return <>Mostrando {simulados.length} itens</>;
        })()}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(simulados ?? []).map((simulado: SimuladoType) => (
          <div key={simulado.id} onMouseEnter={() => prefetchSlug(simulado.slug)} onFocus={() => prefetchSlug(simulado.slug)}>
            <SimuladoCard simulado={simulado} />
          </div>
        ))}
      </div>

      {(simulados ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum simulado encontrado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Não há simulados disponíveis para o concurso selecionado.
          </p>
        </div>
      )}

      {/* Paginação numerada (exibe apenas quando houver mais de 20 simulados no total) */}
      {pagination && (pagination.total ?? 0) > 20 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          {Array.from({ length: pagination.totalPages }).map((_, idx) => {
            const n = idx + 1;
            const isActive = n === (pagination.page ?? page);
            return (
              <Button
                key={n}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
} 