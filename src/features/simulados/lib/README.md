Como referenciar o cache local (evitar falso-positivo do Knip):

- Sempre importar utilitários de cache através de hooks/fetchers da feature, por exemplo:

```ts
import { getSimuladoBySlug } from '../api/fetchers';
```

- Evitar importar diretamente `local-cache.ts` fora dos módulos da feature.
- O arquivo `concurso-local-cache.ts` é consumido nos fetchers; manter essa dependência para o Knip detectar uso.