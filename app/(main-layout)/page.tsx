'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Compass,
  FileCheck,
  RotateCcwSquare,
  Bot,
  Map,
  Layers,
  CalendarCheck,
  BookMarked,
} from 'lucide-react';
import { BrowserExtensionSafe } from '@/components/hydration-safe';

const featureItems = [
  {
    titulo: 'Guru Da Aprovação',
    href: '/guru-da-aprovacao',
    icon: Compass,
    descricao:
      'Junta todos os dados das outras ferramentas e te dá uma noção do quanto você está longe da aprovação.',
  },
  {
    titulo: 'Simulados',
    href: '/simulados',
    icon: FileCheck,
    descricao:
      'Provas do seu edital com explicações das respostas e com o progresso registrado e exibido dentro da plataforma!',
  },
  {
    titulo: 'Questões Semanais',
    href: '/questoes-semanais',
    icon: RotateCcwSquare,
    descricao:
      '5 mil questões respondidas em 50 semanas com uma ofensiva que exibe e te motiva a continuar!',
  },
  {
    titulo: 'Plano de Estudos',
    href: '/plano-estudos',
    icon: Bot,
    descricao:
      'Plano de estudos de acordo com seu concurso, tempo até o edital e horas por dia disponível.',
  },
  {
    titulo: 'Mapa de Matérias',
    href: '/mapa-materias',
    icon: Map,
    descricao:
      'Cria um mapa completo com assuntos a serem estudados, o que já foi estudado e etc.',
  },
  {
    titulo: 'Cartões de Memorização',
    href: '/cartoes-memorizacao',
    icon: Layers,
    descricao:
      'Cartões de memorização é uma técnica para não esquecer o que foi estudado.',
  },
  {
    titulo: 'Apostila Customizada',
    href: '/apostila-customizada',
    icon: BookMarked,
    descricao:
      'Montamos sua apostila completa com tudo que é preciso para passar no seu concurso.',
  },
  {
    titulo: 'Cronograma',
    href: '/cronograma',
    icon: CalendarCheck,
    descricao:
      'O seu cronograma de estudos para o seu concurso, que será criado de acordo com suas preferências.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const memoizedFeatureItems = useMemo(() => featureItems, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.replace('/login');
      setIsAuthChecked(true);
      setIsAuthenticated(false);
    } else {
      setIsAuthChecked(true);
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthChecked || !isAuthenticated) {
    return null;
  }

  return (
    <BrowserExtensionSafe>
      <div className="container-padding py-16">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Bem-vindo ao{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AprovaFácil
              </span>
            </h1>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Recursos Disponíveis</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore todas as ferramentas disponíveis para otimizar seus estudos
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {memoizedFeatureItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a href={item.href} key={item.titulo}>
                    <Card className="card-hover cursor-pointer group h-full">
                      <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{item.titulo}</CardTitle>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.descricao}</p>
                        </div>
                      </CardHeader>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BrowserExtensionSafe>
  );
}