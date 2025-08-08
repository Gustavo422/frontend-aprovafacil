'use client';

import { SessionMonitor } from '@/components/session-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Monitor,
  Palette,
  Globe,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { Label } from '@/components/ui/label';

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const [appSettings, setAppSettings] = useState({
    theme: 'dark',
    language: 'pt-BR',
    autoSave: true,
    notifications: true,
    sound: false,
    animations: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    compactMode: false,
    showProgress: true,
    showTimer: true,
    showHints: true,
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  const handleRefreshSession = async () => {
    try {
      toast({
        title: 'Sessão renovada',
        descricao: 'Sua sessão foi renovada com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao renovar sessão',
        descricao: 'Ocorreu um erro inesperado.',
      });
    }
  };

  const handleExportData = async () => {
    try {
      toast({
        title: 'Dados exportados',
        descricao: 'Seus dados foram exportados com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        descricao: 'Não foi possível exportar seus dados.',
      });
    }
  };

  const handleImportData = async () => {
    try {
      toast({
        title: 'Dados importados',
        descricao: 'Seus dados foram importados com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        descricao: 'Não foi possível importar seus dados.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Personalize sua experiência no AprovaFácil
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Personalizado</span>
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>Exibição</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Palette className="h-6 w-6 text-primary" />
                  <span>Aparência</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tema</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                    value={appSettings.theme}
                    onChange={(e) => setAppSettings({ ...appSettings, theme: e.target.value })}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Idioma</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                    value={appSettings.language}
                    onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Animações</p>
                    <p className="text-sm text-muted-foreground">
                      Habilitar animações na interface
                    </p>
                  </div>
                  <Switch 
                    checked={appSettings.animations}
                    onCheckedChange={(checked) => 
                      setAppSettings({ ...appSettings, animations: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Settings className="h-6 w-6 text-primary" />
                  <span>Comportamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Salvamento automático</p>
                    <p className="text-sm text-muted-foreground">
                      Salvar progresso automaticamente
                    </p>
                  </div>
                  <Switch 
                    checked={appSettings.autoSave}
                    onCheckedChange={(checked) => 
                      setAppSettings({ ...appSettings, autoSave: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Som</p>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir sons na interface
                    </p>
                  </div>
                  <Switch 
                    checked={appSettings.sound}
                    onCheckedChange={(checked) => 
                      setAppSettings({ ...appSettings, sound: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Monitor className="h-6 w-6 text-primary" />
                <span>Configurações de Exibição</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo compacto</p>
                  <p className="text-sm text-muted-foreground">
                    Reduzir espaçamentos na interface
                  </p>
                </div>
                <Switch 
                  checked={displaySettings.compactMode}
                  onCheckedChange={(checked) => 
                    setDisplaySettings({ ...displaySettings, compactMode: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar progresso</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir barras de progresso
                  </p>
                </div>
                <Switch 
                  checked={displaySettings.showProgress}
                  onCheckedChange={(checked) => 
                    setDisplaySettings({ ...displaySettings, showProgress: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar timer</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir cronômetro em simulados
                  </p>
                </div>
                <Switch 
                  checked={displaySettings.showTimer}
                  onCheckedChange={(checked) => 
                    setDisplaySettings({ ...displaySettings, showTimer: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar dicas</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir dicas e sugestões
                  </p>
                </div>
                <Switch 
                  checked={displaySettings.showHints}
                  onCheckedChange={(checked) => 
                    setDisplaySettings({ ...displaySettings, showHints: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Bell className="h-6 w-6 text-primary" />
                <span>Configurações de Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações da aplicação</p>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre atualizações
                  </p>
                </div>
                <Switch 
                  checked={appSettings.notifications}
                  onCheckedChange={(checked) => 
                    setAppSettings({ ...appSettings, notifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Download className="h-6 w-6 text-primary" />
                  <span>Exportar Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Faça backup dos seus dados de estudo e progresso.
                </p>
                <Button onClick={handleExportData} className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Dados
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Upload className="h-6 w-6 text-primary" />
                  <span>Importar Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Restaure seus dados de um backup anterior.
                </p>
                <Button onClick={handleImportData} variant="outline" className="w-full flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Dados
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <RefreshCw className="h-6 w-6 text-primary" />
                <span>Gerenciamento de Sessão</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Renovar sessão</p>
                  <p className="text-sm text-muted-foreground">
                    Renovar sua sessão atual
                  </p>
                </div>
                <Button onClick={handleRefreshSession} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Renovar
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar dados sensíveis</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir informações detalhadas da sessão
                  </p>
                </div>
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
              {showSensitiveData && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <SessionMonitor />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}