"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppHeader } from '@/components/ui/AppHeader';

const sidebarNavItems = [
  { titulo: 'Guru Da Aprovação', href: '/guru-da-aprovacao', icon: 'Compass' },
  { titulo: 'Simulados', href: '/simulados', icon: 'FileCheck' },
  { titulo: 'Questões Semanais', href: '/questoes-semanais', icon: 'RotateCcwSquare' },
  { titulo: 'Plano de Estudos', href: '/plano-estudos', icon: 'Bot' },
  { titulo: 'Mapa de Matérias', href: '/mapa-materias', icon: 'Map' },
  { titulo: 'Cartões de Memorização', href: '/cartoes-memorizacao', icon: 'Layers' },
  { titulo: 'Apostila Customizada', href: '/apostila-customizada', icon: 'BookMarked' },
  { titulo: 'Cronograma', href: '/cronograma', icon: 'CalendarCheck' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-background dark">
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
              <SidebarNav items={sidebarNavItems} />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <AppHeader onSidebarToggle={handleSidebarToggle} />
        {/* Page Content */}
        <main className="flex-1 container-padding py-8">{children}</main>
      </div>
    </div>
  );
} 