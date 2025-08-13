# AprovaFácil – Frontend (Next.js 15 + React 19)

Aplicação Next.js (App Router) com TanStack Query 5, Zustand, Tailwind e integração com Supabase. As rotas API locais fazem proxy para o backend usando `lib/api-utils.ts`.

## Requisitos
- Node.js 18+
- npm

## Variáveis de ambiente
Crie `.env.local` com:
```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
O serviço `lib/environment-service.ts` valida as variáveis e fornece `getBackendUrl()` consumido por APIs e fetchers.

## Scripts
```bash
# Dev / Build / Start
npm run dev            # Next dev --turbo
npm run build
npm start

# Qualidade
npm run lint
npm run lint:fix
npm run type-check

# Testes (Vitest)
npm run test
npm run test:watch
npm run test:coverage
npm run test:ui

# E2E/Visual
npm run test:e2e
npm run test:playwright
npm run test:playwright:ui
npm run test:playwright:debug

# Análise de bundle
npm run analyze
npm run analyze:bundle
npm run analyze:deps
npm run analyze:report
npm run analyze:full
```

## CI

O pipeline `quality-ci.yml` executa typecheck, lint e testes para o frontend e publica relatório do Knip.

Knip local:
```bash
npx knip --reporter json > knip-report-frontend.json
```

## Estrutura
```
frontend/
├── app/                 # Páginas e rotas API (Next)
├── components/          # Componentes (inclui ui/)
├── features/            # Domínios (auth, simulados, ...)
├── hooks/               # Hooks (inclui TanStack helpers)
├── lib/                 # Clients, environment, API utils
├── providers/           # Providers (React Query etc.)
├── tests/               # Unitários
├── e2e/                 # E2E/Visual
└── public/              # Assets
```

## Integração com backend
- `lib/api-utils.ts` expõe `getBackendUrl(path)` e wrappers (`apiGet`, `apiPost`, ...)
- Rotas API em `app/api/*` repassam cookies/headers e `x-correlation-id` para o backend
- React Query já vem configurado em `contexts/ReactQueryProvider.tsx` com Devtools

## Troubleshooting
- Se `NEXT_PUBLIC_BACKEND_API_URL` não estiver configurada/for inválida, as rotas API retornam diagnóstico detalhado.
- Erros de rede/timeout nos fetchers retornam dicas de correção (ver `lib/api-utils.ts`).

## Deploy
- Vercel recomendado. Configure `NEXT_PUBLIC_*` no painel. Rode `npm run build`.

## Licença
MIT



