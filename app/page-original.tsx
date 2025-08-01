'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useState, useCallback, useMemo, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { UserNav } from '@/components/user-nav';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { BrowserExtensionSafe } from '@/components/hydration-safe';

const sidebarNavItems = [
  {
    titulo: 'Guru Da Aprovação',
    href: '/guru-da-aprovacao',
    icon: 'Compass',
  },
  {
    titulo: 'Simulados',
    href: '/simulados',
    icon: 'FileCheck',
  },
  {
    titulo: 'Questões Semanais',
    href: '/questoes-semanais',
    icon: 'RotateCcwSquare',
  },
  {
    titulo: 'Plano de Estudos',
    href: '/plano-estudos',
    icon: 'Bot',
  },
  {
    titulo: 'Mapa de Matérias',
    href: '/mapa-materias',
    icon: 'Map',
  },
  {
    titulo: 'Cartões de Memorização',
    href: '/cartoes-memorizacao',
    icon: 'Layers',
  },
  {
    titulo: 'Apostila Customizada',
    href: '/apostila-customizada',
    icon: 'BookMarked',
  },
  {
    titulo: 'Cronograma',
    href: '/cronograma',
    icon: 'CalendarCheck',
  },
];

const featureItems = [
  {
    titulo: 'Guru Da Aprovação',
    href: '/guru-da-aprovacao',
    icon: Compass,
    descricao: 'Junta todos os dados das outras ferramentas e te dá uma noção do quanto você está longe da aprovação.',
  },
  {
    titulo: 'Simulados',
    href: '/simulados',
    icon: FileCheck,
    descricao: 'Provas do seu edital com explicações das respostas e com o progresso registrado e exibido dentro da plataforma!',
  },
  {
    titulo: 'Questões Semanais',
    href: '/questoes-semanais',
    icon: RotateCcwSquare,
    descricao: '5 mil questões respondidas em 50 semanas com uma ofensiva que exibe e te motiva a continuar!',
  },
  {
    titulo: 'Plano de Estudos',
    href: '/plano-estudos',
    icon: Bot,
    descricao: 'Plano de estudos de acordo com seu concurso, tempo até o edital e horas por dia disponível.',
  },
  {
    titulo: 'Mapa de Matérias',
    href: '/mapa-materias',
    icon: Map,
    descricao: 'Cria um mapa completo com assuntos a serem estudados, o que já foi estudado e etc.',
  },
  {
    titulo: 'Cartões de Memorização',
    href: '/cartoes-memorizacao',
    icon: Layers,
    descricao: 'Cartões de memorização é uma técnica para não esquecer o que foi estudado.',
  },
  {
    titulo: 'Apostila Customizada',
    href: '/apostila-customizada',
    icon: BookMarked,
    descricao: 'Montamos sua apostila completa com tudo que é preciso para passar no seu concurso.',
  },
  {
    titulo: 'Cronograma',
    href: '/cronograma',
    icon: CalendarCheck,
    descricao: 'O seu cronograma de estudos para o seu concurso, que será criado de acordo com suas preferências.',
  },
];

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // const router = useRouter(); // Removido - não usado

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    // Loading state removed as useAuth is no longer available
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const memoizedFeatureItems = useMemo(() => featureItems, []);

  // User check removed as useAuth is no longer available

  return (
    <BrowserExtensionSafe>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-64 p-0"
            onOpenAutoFocus={event => event.preventDefault()}
          >
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <div className="flex flex-col h-full">
              <nav className="flex-1 px-4 py-12">
                <SidebarNav items={sidebarNavItems} />
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content Wrapper */}
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <Button
                  size="icon"
                  className="bg-accent text-accent-foreground"
                  onClick={handleSidebarToggle}
                >
                  <Menu className="h-full w-full" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </div>

              {/* Logo Centralizada */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/aprova_facil_logo.png"
                    alt="AprovaFácil Logo"
                    width={40}
                    height={40}
                    priority
                    className="object-contain"
                  />
                  <span className="text-xl font-black text-[#1e40af] hidden sm:block">
                    AprovaFácil
                  </span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="container-padding py-16">
            <div className="max-w-6xl mx-auto space-y-16">
              {/* Hero Section */}
              <div className="text-center space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Bem-vindo ao{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    AprovaFácil
                  </span>
                </h1>
              </div>

              {/* Features Grid */}
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Recursos Disponíveis</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Explore todas as ferramentas disponíveis para otimizar seus
                    estudos
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {memoizedFeatureItems.map(item => {
                    const IconComponent = item.icon;
                    return (
                      <Link href={item.href} key={item.titulo}>
                        <Card className="card-hover cursor-pointer group h-full">
                          <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                              <CardTitle className="text-lg">
                                {item.titulo}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.descricao}
                              </p>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </BrowserExtensionSafe>
  );
}