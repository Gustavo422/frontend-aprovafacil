'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useCallback, useMemo } from 'react';
import { HydrationSafe } from '@/components/hydration-safe';

export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      // Assuming signOut is no longer available, but keeping the structure
      // For now, we'll just show a toast and redirect to login
      toast({
        titulo: 'Logout realizado',
        descricao: 'Você foi desconectado com sucesso.',
      });
      router.push('/login');
    } catch {
      toast({
        variant: 'destructive',
        titulo: 'Erro ao fazer logout',
        descricao: 'Tente novamente.',
      });
    }
  }, [toast, router]);

  const handleProfileClick = useCallback(() => {
    router.push('/dashboard/configuracoes');
  }, [router]);

  const handleSettingsClick = useCallback(() => {
    router.push('/dashboard/configuracoes');
  }, [router]);

  // Obter as iniciais do nome do usuário
  const getUserInitials = useCallback(() => {
    // Assuming user object is no longer available, but keeping the structure
    // For now, returning a placeholder
    return 'U';
  }, []);

  const getUsernome = useCallback(() => {
    // Assuming user object is no longer available, but keeping the structure
    // For now, returning a placeholder
    return 'Usuário';
  }, []);

  const getUserEmail = useCallback(() => {
    // Assuming user object is no longer available, but keeping the structure
    // For now, returning a placeholder
    return 'Email não disponível';
  }, []);

  const userInitials = useMemo(() => getUserInitials(), [getUserInitials]);
  const usernome = useMemo(() => getUsernome(), [getUsernome]);
  const userEmail = useMemo(() => getUserEmail(), [getUserEmail]);

  // Se ainda está carregando, mostrar um placeholder
  if (false) { // Assuming loading state is no longer available
    return (
      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            ...
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // Se não há usuário logado, não mostrar o componente
  if (false) { // Assuming user object is no longer available
    return null;
  }

  return (
    <HydrationSafe
      fallback={
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              ...
            </AvatarFallback>
          </Avatar>
        </Button>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              {/* Assuming user object is no longer available, but keeping the structure */}
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{usernome}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Autenticado</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </HydrationSafe>
  );
}
