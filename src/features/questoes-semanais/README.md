# Questões Semanais - Frontend

Este módulo implementa a interface de usuário para o sistema de questões semanais do AprovaFácil, permitindo que os usuários acessem, respondam e acompanhem seu progresso nas questões semanais de concursos.

## 🎯 **Funcionalidades Implementadas**

### **Task 6: Data Layer e Hooks**
- ✅ Hook unificado `useWeeklyQuestions` para todas as operações
- ✅ Queries para semana atual, roadmap e histórico
- ✅ Mutação para conclusão de semana com updates otimistas
- ✅ Geração automática de tipos Supabase
- ✅ Cache invalidation inteligente

### **Task 7: Página Principal (SSR+CSR)**
- ✅ Implementação SSR para `atual` + `roadmap` com hidratação
- ✅ Estados explícitos por modo (countdown apenas no `strict`)
- ✅ Componentes modulares e responsivos
- ✅ Skeleton loading e error boundaries

### **Task 9: Reformulação Visual (Coerência de Design)**
- ✅ **Barra de progresso global** com gradientes, animações e indicador flutuante
- ✅ **Timeline horizontal** de semanas com tooltips informativos e hover effects
- ✅ **Card da semana atual** com countdown visual, design moderno e CTA principal
- ✅ **Sumário detalhado** com breakdown por disciplina/assunto e estatísticas visuais
- ✅ **Acessibilidade** com foco visível, aria-labels e navegação por teclado

## 🎨 **Componentes Principais**

### **ProgressoGlobal**
- Barra de progresso animada com gradientes
- Estatísticas visuais em cards coloridos
- Mensagens motivacionais baseadas no progresso
- Indicadores de modo (strict/accelerated)

### **RoadmapTimeline**
- Timeline horizontal para desktop com conectores animados
- Grid responsivo para mobile/tablet
- Tooltips detalhados com informações da semana
- Estados visuais distintos (concluída, atual, disponível, bloqueada)

### **SemanaAtualCard**
- Header com informações da semana e countdown visual
- Questões com design melhorado e alternativas interativas
- Estatísticas da semana em cards visuais
- Botão de conclusão com gradiente e animações

### **HistoricoSection**
- Estatísticas do histórico em cards visuais
- Breakdown por disciplina com performance detalhada
- Lista cronológica com informações completas
- Resumo motivacional personalizado

## 🚀 **Tecnologias Utilizadas**

- **React 18** com hooks modernos
- **TypeScript** para type safety
- **Tailwind CSS** para design responsivo
- **Heroicons** para ícones consistentes
- **React Query** para gerenciamento de estado
- **Next.js 15** com SSR/CSR

## 📱 **Responsividade**

- **Desktop**: Timeline horizontal com tooltips
- **Tablet**: Grid adaptativo com cards médios
- **Mobile**: Layout em coluna única otimizado

## ♿ **Acessibilidade**

- Foco visível em todos os elementos interativos
- Aria-labels para elementos complexos
- Navegação por teclado funcional
- Contraste adequado e tamanhos de fonte legíveis
- Estados visuais claros para diferentes status

## 🔧 **Como Usar**

```tsx
import { QuestoesSemanaisPage } from '@/features/questoes-semanais/components';

// A página principal já inclui todos os componentes
export default function QuestoesSemanaisPageWrapper() {
  return (
    <Suspense fallback={<QuestoesSemanaisSkeleton />}>
      <QuestoesSemanaisPage />
    </Suspense>
  );
}
```

## 📊 **Estrutura de Dados**

### **SemanaAtual**
```typescript
interface SemanaAtual {
  questao_semanal: SemanaBasicaDTO | null;
  questoes: QuestaoDTO[];
  historico: ProgressoSemana[];
  status: {
    semana_atual: number;
    modo_desbloqueio: 'strict' | 'accelerated';
    tempo_restante?: number;
  };
}
```

### **RoadmapItem**
```typescript
interface RoadmapItem {
  numero_semana: number;
  status: 'done' | 'current' | 'locked' | 'available';
  titulo?: string;
  disciplina?: string;
  assunto?: string;
  nivel_dificuldade?: string;
  liberaEm?: string;
  progresso?: {
    concluido: boolean;
    pontuacao: number;
    tempo_minutos: number;
  };
}
```

## 🎨 **Sistema de Design**

### **Cores**
- **Primária**: Azul (#2563eb) para elementos principais
- **Sucesso**: Verde (#16a34a) para conclusões
- **Atenção**: Amarelo (#ca8a04) para modo strict
- **Neutro**: Cinza (#6b7280) para elementos secundários

### **Tipografia**
- **Títulos**: Font-bold com tamanhos variados (2xl, 3xl)
- **Corpo**: Font-medium para texto principal
- **Legendas**: Text-sm para informações secundárias

### **Espaçamento**
- **Container**: p-8 para espaçamento interno
- **Seções**: mb-8 para separação entre componentes
- **Elementos**: gap-6 para espaçamento em grids

### **Animações**
- **Transições**: duration-300 para mudanças suaves
- **Hover**: scale-105 e shadow-lg para interatividade
- **Progresso**: duration-1000 para barras animadas

## 🔮 **Próximos Passos**

- Implementar Task 10 (Schema e consistência)
- Adicionar Task 11 (Tabela de status do usuário)
- Implementar Task 12 (Triggers/Functions/Edge)
- Finalizar Task 14 (Segurança e RLS)

## 📝 **Notas de Implementação**

- Todos os componentes seguem o padrão de design do AprovaFácil
- Estados visuais são consistentes entre componentes
- Animações são sutis e não interferem na usabilidade
- Responsividade é priorizada em todos os breakpoints
- Acessibilidade é implementada desde o início
