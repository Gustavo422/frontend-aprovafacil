'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

export default function SelecionarConcursoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header - Layout simples sem sidebar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {/* Botão de menu desabilitado para esta página */}
              <Button
                size="icon"
                className="bg-accent text-accent-foreground opacity-50 cursor-not-allowed"
                disabled
              >
                <Menu className="h-full w-full" />
                <span className="sr-only">Menu desabilitado</span>
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
                <span className="text-xl font-black text-[#1e40af]">
                  AprovaFácil
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Link simples para configurações */}
              <Link href="/configuracoes">
                <Button variant="ghost" size="sm">
                  Configurações
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 