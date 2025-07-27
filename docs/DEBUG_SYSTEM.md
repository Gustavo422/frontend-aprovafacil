# Sistema de Debug - AprovaFacil

Este documento descreve o sistema completo de debug implementado no frontend do AprovaFacil, que permite monitorar e diagnosticar problemas de conexão e recebimento de dados do backend.

## 🎯 Objetivo

O sistema de debug foi criado para resolver problemas como:
- Dados não sendo carregados corretamente
- Erros de conexão com o backend
- Problemas de performance em requisições
- Debug de estado de componentes
- Visualização de dados brutos em tempo real

## 🚀 Como Usar

### 1. Ativação Automática

O sistema é ativado automaticamente em ambiente de desenvolvimento. Você verá no console:

```
🎉 === SISTEMA DE DEBUG ATIVO ===

🔧 Para começar a usar:
  debugHelpers.showHelp() - Ver todos os comandos disponíveis
  debugHelpers.testBackendConnection() - Testar conexão com backend
  debugHelpers.checkSystemStatus() - Verificar status do sistema

💡 Dica: Use Ctrl+Shift+Z para abrir o painel de debug rapidamente!
```

### 2. Painel de Debug Flutuante

- **Atalho de teclado**: `Ctrl + Shift + Z`
- **Botão flutuante**: Aparece no canto inferior direito em desenvolvimento
- **Funcionalidades**:
  - Visualizar logs em tempo real
  - Filtrar por tipo (API, Componente, Estado, Erro, Info)
  - Buscar em logs
  - Exportar dados
  - Limpar histórico

### 3. Página de Debug Completa

Acesse `/debug` para uma interface completa com:
- Testador de API interativo
- Estatísticas de requisições
- Histórico de chamadas
- Exportação de dados
- Comandos úteis

## 📊 Componentes do Sistema

### 1. Interceptor de API (`api-interceptor.ts`)

Captura automaticamente todas as requisições HTTP:

```typescript
// Exemplo de uso
const response = await fetch('/api/users'); // Automaticamente interceptado
```

**Funcionalidades**:
- Intercepta `fetch()` e `XMLHttpRequest`
- Registra tempo de resposta
- Captura erros de rede
- Mantém histórico de chamadas
- Estatísticas em tempo real

### 2. Hook de Debug (`useDebug.tsx`)

Hook personalizado para debug de componentes:

```typescript
import { useDebug } from '../hooks/useDebug';

function MeuComponente() {
  const { logInfo, logError, logApiCall, logState } = useDebug({ 
    componentName: 'MeuComponente' 
  });

  // Logar informações
  logInfo('Componente montado');
  
  // Logar erros
  logError(error, 'contexto');
  
  // Logar chamadas de API
  logApiCall('/api/data', 'GET', requestData, responseData, 200, 150);
  
  // Logar mudanças de estado
  logState(users, 'users');
}
```

### 3. Visualizador de Dados Brutos (`RawDataViewer.tsx`)

Componente para visualizar dados JSON em tempo real:

```typescript
import { RawDataViewer } from '../components/debug/RawDataViewer';

<RawDataViewer
  data={meusDados}
  title="Dados dos Usuários"
  componentName="MeuComponente"
  defaultCollapsed={false}
/>
```

### 4. Botão de Debug (`DebugButton.tsx`)

Botão flutuante com controles rápidos:

```typescript
import DebugButton from '../components/debug/DebugButton';

<DebugButton 
  position="bottom-right" 
  showStats={true} 
/>
```

## 🔧 Comandos do Console

### Helpers Globais

```javascript
// Ver ajuda completa
debugHelpers.showHelp()

// Ativar debug para namespaces específicos
debugHelpers.enableDebug('app:frontend:api:*')

// Desativar debug
debugHelpers.disableDebug()

// Testar conexão com backend
debugHelpers.testBackendConnection()

// Verificar status do sistema
debugHelpers.checkSystemStatus()

// Limpar todos os dados
debugHelpers.clearAllDebugData()

// Exportar todos os dados
debugHelpers.exportAllDebugData()
```

### Interceptor de API

```javascript
// Ver todas as chamadas
apiInterceptor.getCalls()

// Filtrar chamadas
apiInterceptor.getCallsByFilter({hasError: true})
apiInterceptor.getCallsByFilter({method: 'POST'})
apiInterceptor.getCallsByFilter({url: '/api/users'})

// Ver estatísticas
apiInterceptor.getStats()

// Exportar histórico
apiInterceptor.exportCalls()

// Limpar histórico
apiInterceptor.clearCalls()
```

### Logging Manual

```javascript
// Adicionar log manual
addDebugData({
  type: 'info',
  title: 'Teste Manual',
  data: { mensagem: 'Olá mundo' }
})

// Log específico de componente (se disponível)
debug_MeuComponente.logInfo('Mensagem', dados)
debug_MeuComponente.logError(erro, 'contexto')
debug_MeuComponente.logState(estado, 'nome')
```

## 📋 Namespaces de Debug

O sistema usa namespaces para organizar os logs:

- `app:frontend:api:*` - Requisições de API
- `app:frontend:component:*` - Componentes React
- `app:frontend:state:*` - Gerenciamento de estado
- `app:frontend:hook:*` - Hooks personalizados
- `app:frontend:error:*` - Erros e exceções
- `app:frontend:performance:*` - Métricas de performance
- `app:frontend:*` - Todos os namespaces

## 🎨 Personalização

### Configuração de Debug

```typescript
// Em config/debug.ts
export const DEBUG_CONFIG = {
  baseNamespace: 'app:frontend',
  defaultNamespaces: 'app:frontend:*',
  maxLogLength: 10000,
  measurePerformance: true,
  performanceThreshold: {
    api: 500,       // Alertas para requisições > 500ms
    render: 100,    // Alertas para renderização > 100ms
    transition: 300 // Alertas para transições > 300ms
  }
};
```

### Hook Personalizado

```typescript
// Hook especializado para API
const { debugApiCall } = useApiDebug('MeuComponente');

const response = await debugApiCall('/api/data', 'GET', null, () => 
  fetch('/api/data')
);

// Hook para estado com debug
const [users, setUsers] = useStateDebug([], 'users', 'MeuComponente');
```

## 🔍 Exemplos de Uso

### 1. Debug de Componente com API

```typescript
import { useDebug } from '../hooks/useDebug';
import { RawDataViewer } from '../components/debug/RawDataViewer';

function ListaUsuarios() {
  const { logInfo, logError, logApiCall } = useDebug({ 
    componentName: 'ListaUsuarios' 
  });
  const { RawDataViewer } = useRawDataViewer('ListaUsuarios');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      logInfo('Iniciando busca de usuários');
      
      const startTime = performance.now();
      const response = await fetch('/api/users');
      const duration = performance.now() - startTime;
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      logApiCall('/api/users', 'GET', null, data, response.status, duration);
      
      setUsers(data);
      logInfo('Usuários carregados', { count: data.length });
    } catch (error) {
      logError(error, 'fetchUsers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchUsers}>Carregar Usuários</button>
      
      <RawDataViewer
        data={users}
        title="Dados dos Usuários"
        defaultCollapsed={false}
      />
    </div>
  );
}
```

### 2. Debug de Erros

```typescript
function ComponenteComErro() {
  const { logError } = useDebug({ componentName: 'ComponenteComErro' });

  const handleError = async () => {
    try {
      // Simular erro
      throw new Error('Erro de teste');
    } catch (error) {
      logError(error, 'handleError');
    }
  };

  return <button onClick={handleError}>Simular Erro</button>;
}
```

### 3. Debug de Performance

```typescript
import { measureAsync } from '../utils/performance-debug';

const slowOperation = async () => {
  return await measureAsync('Operação Lenta', async () => {
    // Sua operação aqui
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 500); // Alerta se > 500ms
};
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Debug não aparece**
   - Verifique se está em ambiente de desenvolvimento
   - Recarregue a página após ativar debug
   - Verifique o console para mensagens de erro

2. **Interceptor não captura requisições**
   - Verifique se o arquivo `init-debug.ts` está sendo importado
   - Confirme que `apiInterceptor` está disponível no console
   - Teste com `debugHelpers.testBackendConnection()`

3. **Painel de debug não abre**
   - Use `Ctrl+Shift+Z` como atalho
   - Verifique se não há conflitos de CSS
   - Confirme que o componente `DebugButton` está renderizado

### Verificação de Status

```javascript
// Verificar se tudo está funcionando
debugHelpers.checkSystemStatus()

// Verificar interceptor
console.log('API Interceptor:', !!apiInterceptor)

// Verificar painel de debug
console.log('Debug Panel:', !!addDebugData)
```

## 📁 Estrutura de Arquivos

```
frontend/
├── components/debug/
│   ├── DebugPanel.tsx          # Painel flutuante de debug
│   ├── DebugButton.tsx         # Botão flutuante
│   ├── RawDataViewer.tsx       # Visualizador de dados
│   └── DebugExample.tsx        # Exemplo de uso
├── hooks/
│   └── useDebug.tsx            # Hook principal de debug
├── utils/
│   ├── api-interceptor.ts      # Interceptor de API
│   ├── debug-tools.ts          # Ferramentas de debug
│   ├── debugger.ts             # Sistema de logging
│   ├── performance-debug.ts    # Debug de performance
│   └── init-debug.ts           # Inicialização automática
├── config/
│   └── debug.ts                # Configurações
└── app/
    └── debug/
        └── page.tsx            # Página de debug completa
```

## 🎯 Próximos Passos

1. **Integração com Backend**: Adicionar logs do backend no painel
2. **Métricas Avançadas**: Gráficos de performance e erros
3. **Alertas**: Notificações para erros críticos
4. **Exportação**: Mais formatos de exportação (CSV, Excel)
5. **Filtros Avançados**: Filtros por data, componente, tipo de erro

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Use `debugHelpers.showHelp()` no console
3. Acesse `/debug` para interface completa
4. Verifique os logs no console do navegador 