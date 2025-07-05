'use client';

import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { UserNav } from '@/components/user-nav';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Simulados',
    href: '/dashboard/simulados',
    icon: 'FileText',
  },
  {
    title: 'Questões Semanais',
    href: '/dashboard/questoes-semanais',
    icon: 'ListChecks',
  },
  {
    title: 'Plano de Estudos',
    href: '/dashboard/plano-estudos',
    icon: 'Calendar',
  },
  {
    title: 'Mapa de Assuntos',
    href: '/dashboard/mapa-assuntos',
    icon: 'Map',
  },
  {
    title: 'Flashcards',
    href: '/dashboard/flashcards',
    icon: 'Layers',
  },
  {
    title: 'Apostilas',
    href: '/dashboard/apostilas',
    icon: 'BookOpen',
  },
  {
    title: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: 'Settings',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const memoizedSidebarItems = useMemo(() => sidebarNavItems, []);

  const fallbackComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  ), []);

  return (
    <AuthGuard 
      requireAuth={true}
      fallback={fallbackComponent}
    >
      <div className="flex min-h-screen bg-background">
        {/* Sidebar as Sheet for both Mobile and Desktop */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-64 p-0"
            onOpenAutoFocus={event => event.preventDefault()}
          >
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <div className="flex flex-col h-full">
              <nav className="flex-1 px-4 py-12">
                <SidebarNav items={memoizedSidebarItems} />
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
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
                <Link href="/dashboard" className="flex items-center space-x-3">
                  <Image
                    src="/aprova_facil_logo.png"
                    alt="AprovaFácil Logo"
                    width={40}
                    height={40}
                    priority
                    className="object-contain"
                  />
                  <span className="text-xl font-black text-[#1e40af]">
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
          <main className="flex-1 container-padding py-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
