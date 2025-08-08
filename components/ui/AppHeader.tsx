'use client';

import React from 'react';
import { Button } from './button';
import { Menu } from 'lucide-react';
import { UserNav } from '@/components/user-nav';

interface AppHeaderProps {
  onSidebarToggle: () => void;
}

export function AppHeader({ onSidebarToggle }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-background border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">AprovaFácil</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <UserNav />
      </div>
    </header>
  );
}