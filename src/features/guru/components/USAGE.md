# Componentes da Feature Guru – Guia Rápido de Uso

## StatsStatusCards

Props: `stats: EnhancedStatsDTO`

Exemplo de uso com dados fictícios:

```tsx
import { StatsStatusCards } from '@/src/features/guru/components/StatsStatusCards'

const mockStats = {
  totalSimulados: 12,
  totalQuestoes: 420,
  totalStudyTime: 735,
  averageScore: 68.4,
  accuracyRate: 73.2,
  approvalProbability: 62.5,
  studyStreak: 7,
  weeklyProgress: {
    simulados: 3,
    questoes: 95,
    studyTime: 180,
    scoreImprovement: 2.4,
  },
  disciplinaStats: [],
  performanceHistory: [],
  goalProgress: {
    targetScore: 70,
    currentScore: 68.4,
    targetDate: '2025-12-31',
    daysRemaining: 120,
    onTrack: true,
  },
  competitiveRanking: {
    position: 120,
    totalusuarios: 2000,
    percentile: 94.0,
  },
}

export function DemoStatsCards() {
  return <StatsStatusCards stats={mockStats} />
}
```

## RecentActivitiesList

Props: `activities: ActivityDTO[]`

Exemplo de uso com dados fictícios:

```tsx
import { RecentActivitiesList } from '@/src/features/guru/components/RecentActivitiesList'

const mockActivities = [
  {
    id: 'a1',
    type: 'simulado',
    titulo: 'Simulado de Direito Administrativo',
    descricao: '50 questões',
    created_at: new Date().toISOString(),
    score: 72,
    improvement: 3.5,
  },
  {
    id: 'a2',
    type: 'questao',
    titulo: 'Questões de Matemática Financeira',
    descricao: '20 questões resolvidas',
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
]

export function DemoActivitiesList() {
  return <RecentActivitiesList activities={mockActivities} />
}
```

## Usando com os hooks

```tsx
import { useEnhancedStats } from '@/src/features/guru/hooks/useEnhancedStats'
import { useRecentActivities } from '@/src/features/guru/hooks/useRecentActivities'
import { StatsStatusCards } from '@/src/features/guru/components/StatsStatusCards'
import { RecentActivitiesList } from '@/src/features/guru/components/RecentActivitiesList'

export function GuruDashboardSection() {
  const { data: stats, isLoading: loadingStats } = useEnhancedStats()
  const { data: activities, isLoading: loadingAct } = useRecentActivities({ limit: 10 })

  if (loadingStats || loadingAct) return <div>Carregando…</div>

  return (
    <div className="space-y-6">
      {stats && <StatsStatusCards stats={stats} />}
      {activities && <RecentActivitiesList activities={activities} />}
    </div>
  )
}
```

Observações:
- Componentes são puramente apresentacionais (sem fetch interno).
- Para visualização isolada, use os mocks acima ou adapte aos seus dados.

