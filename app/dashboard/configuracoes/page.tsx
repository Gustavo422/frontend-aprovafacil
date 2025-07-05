'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { SessionMonitor } from '@/components/session-monitor';
import { AuthStatus } from '@/components/auth-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Clock, 
  Activity, 
  Settings, 
  LogOut, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesPage() {
  const { user, signOut, refreshSession, isRefreshing } = useAuth();
  const { toast } = useToast();
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      router.push('/login');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer logout',
        description: 'Tente novamente.',
      });
    }
  };

  const handleRefreshSession = async () => {
    try {
      const success = await refreshSession();
      if (success) {
        toast({
          title: 'Sessão renovada',
          description: 'Sua sessão foi renovada com sucesso.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao renovar sessão',
          description: 'Não foi possível renovar sua sessão.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao renovar sessão',
        description: 'Ocorreu um erro inesperado.',
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Carregando configurações...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações de conta e segurança
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Autenticado</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Sessão</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Conta</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Status de Autenticação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AuthStatus />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Ações de Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={handleRefreshSession}
                    disabled={isRefreshing}
                    className="w-full"
                    variant="outline"
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Renovando Sessão...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renovar Sessão
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleLogout}
                    className="w-full"
                    variant="destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Fazer Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="session" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Monitor de Sessão</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SessionMonitor />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Informações da Sessão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ID da Sessão:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {showSensitiveData ? user.id : '••••••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                      >
                        {showSensitiveData ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Nome:</span>
                    <span className="text-sm">
                      {user.user_metadata?.name || 'Não definido'}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conta criada:</span>
                    <span className="text-sm">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Último login:</span>
                    <span className="text-sm">
                      {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações da Conta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações Pessoais</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas informações pessoais e preferências de conta.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Notificações</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure como você gostaria de receber notificações sobre sua conta.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Privacidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Controle suas configurações de privacidade e dados pessoais.
                  </p>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Excluir Conta</h3>
                    <p className="text-sm text-muted-foreground">
                      Exclua permanentemente sua conta e todos os dados associados.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
