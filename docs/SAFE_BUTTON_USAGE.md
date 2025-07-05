# Uso do SafeButton e useSafeAction

Este documento descreve como usar o componente `SafeButton` e o hook `useSafeAction` para lidar com ações assíncronas de forma segura no frontend.

## Visão Geral

O `SafeButton` é um componente que encapsula a lógica de tratamento de erros e estados de carregamento para ações assíncronas. Ele é construído sobre o hook `useSafeAction`, que pode ser usado independentemente quando necessário.

## Componente SafeButton

### Importação

```tsx
import { SafeButton } from '@/components/ui/safe-button';
```

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `action` | `(data?: any) => Promise<{ data: T }>` | Sim | Função assíncrona a ser executada quando o botão for clicado |
| `children` | `React.ReactNode` | Sim | Conteúdo do botão |
| `successMessage` | `string` | Não | Mensagem de sucesso a ser exibida quando a ação for bem-sucedida |
| `errorMessage` | `string` | Não | Mensagem de erro a ser exibida quando a ação falhar |
| `onSuccess` | `(data: T) => void` | Não | Callback chamado quando a ação é bem-sucedida |
| `onError` | `(error: Error) => void` | Não | Callback chamado quando a ação falha |
| `onComplete` | `() => void` | Não | Callback chamado quando a ação é concluída (tanto em sucesso quanto em falha) |
| `disabled` | `boolean` | Não | Desabilita o botão |
| `className` | `string` | Não | Classes CSS adicionais |
| `variant` | `'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'` | Não | Variante de estilo do botão |
| `size` | `'default' | 'sm' | 'lg' | 'icon'` | Não | Tamanho do botão |

### Exemplo Básico

```tsx
<SafeButton 
  action={async () => {
    const response = await fetch('/api/example');
    const data = await response.json();
    return { data };
  }}
  successMessage="Operação realizada com sucesso!"
  errorMessage="Falha ao executar a operação"
>
  Salvar Alterações
</SafeButton>
```

### Exemplo com Callbacks

```tsx
<SafeButton
  action={async (formData) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    return await response.json();
  }}
  onSuccess={(data) => {
    // Atualizar estado ou redirecionar
    router.push('/success');
  }}
  onError={(error) => {
    console.error('Erro ao salvar:', error);
  }}
  onComplete={() => {
    // Executar código após a conclusão (sucesso ou falha)
    setSubmitting(false);
  }}
>
  {isSubmitting ? 'Salvando...' : 'Salvar'}
</SafeButton>
```

## Hook useSafeAction

O `useSafeAction` pode ser usado independentemente quando você precisa de mais controle sobre a renderização ou quando está trabalhando com formulários complexos.

### Importação

```tsx
import { useSafeAction } from '@/hooks/use-safe-action';
```

### Retorno

O hook retorna um objeto com as seguintes propriedades:

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `execute` | `(data?: any) => Promise<void>` | Função para executar a ação |
| `isLoading` | `boolean` | Indica se a ação está em andamento |
| `error` | `Error | null` | Erro da última execução, se houver |
| `data` | `T | null` | Dados retornados pela última execução bem-sucedida |

### Exemplo de Uso

```tsx
import { useSafeAction } from '@/hooks/use-safe-action';
import { toast } from 'sonner';

function DeleteButton({ itemId }) {
  const { execute, isLoading } = useSafeAction(
    async (id) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    },
    {
      onSuccess: () => {
        toast.success('Item excluído com sucesso');
        // Atualizar lista de itens
      },
      onError: (error) => {
        toast.error('Falha ao excluir o item');
        console.error(error);
      },
    }
  );

  return (
    <button 
      onClick={() => execute(itemId)}
      disabled={isLoading}
      className="..."
    >
      {isLoading ? 'Excluindo...' : 'Excluir'}
    </button>
  );
}
```

## Boas Práticas

1. **Mensagens de Erro Úteis**: Sempre forneça mensagens de erro descritivas para ajudar os usuários a entenderem o que deu errado.

2. **Feedback Visual**: Use o estado `isLoading` para fornecer feedback visual durante a execução da ação.

3. **Tratamento de Erros**: Implemente tratamento de erros específicos quando necessário, usando o callback `onError`.

4. **Limpeza**: Use o callback `onComplete` para limpar estados ou executar ações que devem ocorrer independentemente do resultado da operação.

5. **Testes**: Certifique-se de testar os diferentes estados e cenários de erro do seu componente.

## Exemplo Completo

```tsx
import { SafeButton } from '@/components/ui/safe-button';
import { useRouter } from 'next/navigation';

function SubmitForm({ formData }) {
  const router = useRouter();
  
  const handleSubmit = async (data) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Falha ao enviar o formulário');
    }
    
    return await response.json();
  };

  return (
    <div className="space-y-4">
      <h2>Enviar Formulário</h2>
      
      <SafeButton
        action={() => handleSubmit(formData)}
        successMessage="Formulário enviado com sucesso!"
        errorMessage="Erro ao enviar o formulário. Tente novamente."
        onSuccess={(data) => {
          // Redirecionar para a página de sucesso
          router.push(`/success/${data.id}`);
        }}
        variant="default"
        size="lg"
      >
        Enviar Formulário
      </SafeButton>
    </div>
  );
}
```
