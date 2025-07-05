'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  Calendar,
  Map,
  Layers,
  BookOpen,
  Settings,
} from 'lucide-react';
import { useMemo } from 'react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  const iconMap = useMemo(() => ({
    LayoutDashboard,
    FileText,
    ListChecks,
    Calendar,
    Map,
    Layers,
    BookOpen,
    Settings,
  }), []);

  return (
    <nav className={cn('space-y-1', className)} {...props}>
      {items.map(item => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
            )}
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
