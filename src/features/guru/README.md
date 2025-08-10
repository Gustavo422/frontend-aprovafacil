# Feature Guru (Frontend)

Boundary da página `app/guru-da-aprovacao`.

## API Client
- Usa `getBackendUrl` para compor URLs do backend
- Headers padronizados e `x-correlation-id`

## Hooks
- `useEnhancedStats()`
  - Endpoint: `/api/guru/v1/dashboard/enhanced-stats`
  - staleTime: 5 min
  - Query key base: `['concurso-query', endpoint, activeConcursoId]`
- `useRecentActivities({ limit })`
  - Endpoint: `/api/guru/v1/dashboard/activities`
  - staleTime: 2 min
  - Params suportados: `limit` (default 10)
  - Query key base: `['concurso-query-with-params', endpoint, activeConcursoId, params]`

Estados esperados: loading, empty (lista vazia), error (usa `ErrorBlock` com ação de retry).

## Componentes
- `StatsStatusCards`: apresentacional, recebe `EnhancedStatsDTO`
- `RecentActivitiesList`: apresentacional, recebe `ActivityDTO[]`
- `ErrorBlock`: erro padrão com botão de retry

## Contratos (DTOs)
Ver `api/contracts.ts` (espelha backend):
- `EnhancedStatsDTO`
- `ActivityDTO`

## Notas de Cache
- Hooks dependem de `activeConcursoId` (ConcursoContext)
- Chaves incluem o concurso ativo para evitar poluição entre usuários/concursos
- Revalidação manual: recarregar página ou invalidar queries pelo QueryClient

### Regras de Cache (React Query) – detalhamento

- useEnhancedStats
  - Query key: `['concurso-query', '/api/guru/v1/dashboard/enhanced-stats', activeConcursoId]`
  - staleTime: 5 minutos (300_000 ms)
  - enabled: somente quando `requireConcurso = true` e há `activeConcursoId` disponível; caso contrário, não dispara o fetch
  - fallback: quando `requireConcurso = true` e não há concurso selecionado, retorna `fallbackData` (se fornecido) e mantém a query desabilitada

- useRecentActivities
  - Query key: `['concurso-query-with-params', '/api/guru/v1/dashboard/activities', activeConcursoId, { limit }]`
  - staleTime: 2 minutos (120_000 ms)
  - params: devem ser valores primitivos (números, strings) para manter a chave estável
  - enabled/fallback: mesmas regras de `useEnhancedStats`

- Invalidação recomendada
  - Específica por endpoint e concurso:
    ```ts
    import { queryClient } from '@tanstack/react-query'
    queryClient.invalidateQueries({
      queryKey: ['concurso-query', '/api/guru/v1/dashboard/enhanced-stats', activeConcursoId],
    })
    queryClient.invalidateQueries({
      queryKey: ['concurso-query-with-params', '/api/guru/v1/dashboard/activities', activeConcursoId],
    })
    ```
  - Global da feature (todas as queries do módulo):
    ```ts
    queryClient.invalidateQueries({ queryKey: ['concurso-query'] })
    queryClient.invalidateQueries({ queryKey: ['concurso-query-with-params'] })
    ```

- SSR/CSR
  - Os hooks são usados em componentes `use client`. As rotas Next em `app/api/guru/v1/...` atuam como gateway para o backend usando `getBackendUrl`, funcionando em SSR/CSR sem dependência de `window`.

- Headers e correlação
  - Toda requisição envia `Authorization: Bearer <token>` (quando presente) e `x-correlation-id` gerado no cliente para rastreabilidade ponta a ponta.

## Feature Flag (rollout)
- Variáveis:
  - `NEXT_PUBLIC_GURU_NEW_MODULE_FLAG`: `off` | `canary` | `on` (default: `on`)
  - `NEXT_PUBLIC_GURU_NEW_MODULE_CANARY_PERCENT`: 0–100 (default: 0)
- Config: `features/guru/config/feature-flags.ts` define os endpoints usados pelos gateways de API do Next.