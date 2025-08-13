ConcursoLocalCache v2 (Simulados)

Este arquivo documenta o contrato de cache local para a feature de simulados.

Chaves por concurso
- `simulados_index:<concurso_id>` → `{ items: SimuladoListItem[], updatedAtMs }`
- ETags/Last-Modified: associados à mesma chave (`simulados_index:<concurso_id>`)

Chaves por simulado
- `simulado:<concurso_id>:<slug>` → `{ meta?, questoes? }`
  - `meta`: campos de `simulados` essenciais para a UI
  - `questoes`: lista resumida `{ id, numero_questao, atualizado_em }`
- ETags/Last-Modified por seção:
  - `simulado_meta:<concurso_id>:<slug>`
  - `simulado_questoes:<concurso_id>:<slug>`

TTL
- 30 minutos (configurável via `CONCURSO_CACHE_TTL_MS`).

APIs utilitárias (lib/concurso-local-cache.ts)
- `getSimuladosIndex` / `setSimuladosIndex`
- `getSimuladoCache` / `upsertSimuladoMeta` / `upsertSimuladoQuestoes`
- `getIndexETags` / `getSimuladoETags`
- `isExpired`
- `mergeQuestoesById`

Uso nos fetchers
- `listSimulados(concursoId, filters)`
  - If-None-Match/If-Modified-Since com ETag/Last-Modified do índice
  - TTL gating; fallback para índice quando offline ou 304
- `getSimuladoBySlug(slug, concursoId)` e `getQuestoesBySlug(slug, concursoId)`
  - ETag/Last-Modified por seção; TTL gating e fallback offline

Boas práticas
- Não sobrescrever progresso do usuário; manter em espaço próprio (futuro: `simulado_progress:<usuario_id>:<simulado_id>`)
- Evitar side effects: somente funções puras exportadas
- Respeitar SSR: checagens `typeof window !== 'undefined'`

