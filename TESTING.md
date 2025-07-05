# Guia de Testes

Este documento descreve a configuração e as boas práticas para testes no projeto.

## Visão Geral

O projeto utiliza duas ferramentas de teste:
1. **Jest**: Configurado para testes unitários e de integração
2. **Vitest**: Configurado, mas não ativamente utilizado no momento

## Configuração

### Jest
- **Arquivo de configuração**: `jest.config.js`
- **Setup global**: `jest.setup.js`
- **Extensões suportadas**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Ambiente**: Node.js (configurado para simular navegador quando necessário)

### Vitest
- **Arquivo de configuração**: `vitest.config.ts`
- **Atualmente não utilizado** ativamente nos scripts de teste

## Boas Práticas

### 1. Estrutura de Pastas
```
frontend/
  __tests__/
    components/    # Testes de componentes
    hooks/         # Testes de hooks
    lib/           # Testes de utilitários
    api/           # Testes de chamadas de API
```

### 2. Convenções de Nomeação
- Arquivos de teste: `[nome].test.ts` ou `[nome].test.tsx`
- Testes de componentes: `[NomeDoComponente].test.tsx`
- Testes de hooks: `use[hookName].test.ts`

### 3. Testando Componentes
```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### 4. Testando Hooks
```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useSafeAction } from '@/hooks/use-safe-action';

describe('useSafeAction', () => {
  it('should handle successful action', async () => {
    const mockAction = jest.fn().mockResolvedValue({ data: 'success' });
    const { result, waitForNextUpdate } = renderHook(() => 
      useSafeAction(mockAction)
    );
    
    await act(async () => {
      await result.current.execute();
    });
    
    expect(mockAction).toHaveBeenCalled();
  });
});
```

### 5. Mocking
Use mocks para dependências externas:
```typescript
// No topo do arquivo de teste
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
```

## Executando Testes

### Comandos disponíveis:
```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Gerar cobertura de código
npm run test:coverage

# Executar testes específicos
npx jest src/path/to/test.ts
```

## Solução de Problemas Comuns

### Testes não estão sendo executados
1. Verifique se há erros de sintaxe nos arquivos de teste
2. Confirme se o arquivo de teste tem a extensão correta (`.test.ts` ou `.test.tsx`)
3. Verifique se o arquivo está na pasta `__tests__` ou tem `.test` no nome

### Erros de importação
1. Verifique os caminhos de importação
2. Confirme se os aliases do TypeScript estão configurados corretamente
3. Verifique se todas as dependências estão instaladas

## Próximos Passos
1. Migrar completamente para Vitest para melhor suporte a ES Modules
2. Adicionar mais testes de integração
3. Configurar relatórios de cobertura mais detalhados
