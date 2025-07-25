// AppHeader.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import type { MouseEventHandler } from 'react';

interface AppHeaderProps {
  onSidebarToggle?: MouseEventHandler<HTMLButtonElement>;
}

export function AppHeader({ onSidebarToggle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {onSidebarToggle && (
            <Button
              size="icon"
              className="bg-accent text-accent-foreground"
              onClick={onSidebarToggle}
            >
              <Menu className="h-full w-full" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          )}
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
  );
} 