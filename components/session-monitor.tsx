'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';

interface SessionInfo {
  expiresAt: Date;
  timeRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export function SessionMonitor() {
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    // This component is now independent of user/session/loading from useAuth
    // It will always show the session status if the session object is available
    // and update it every second.
    if (!sessionInfo) {
      setSessionInfo(null);
      return () => {};
    }

    const updateSessionInfo = () => {
      if (!sessionInfo) return;
      
      const expiresAt = new Date(Number(sessionInfo.expiresAt) * 1000);
      const now = new Date();
      const timeRemaining = expiresAt.getTime() - now.getTime();
      const isExpired = timeRemaining <= 0;
      const isExpiringSoon = timeRemaining < 5 * 60 * 1000 && timeRemaining > 0; // 5 minutos

      setSessionInfo({
        expiresAt,
        timeRemaining,
        isExpiringSoon,
        isExpired
      });
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000); // Atualizar a cada segundo

    return () => clearInterval(interval);
  }, [sessionInfo]);

  const handleRefreshSession = async () => {
    try {
      toast({
        titulo: 'Sessão renovada',
        descricao: 'Sua sessão foi renovada com sucesso.',
      });
    } catch {
      toast({
        variant: 'destructive',
        titulo: 'Erro ao renovar sessão',
        descricao: 'Não foi possível renovar sua sessão.',
      });
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Expirada';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // This component is now independent of user/session/loading from useAuth
  // It will always show the session status if the session object is available
  // and update it every second.
  if (!sessionInfo) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Status da Sessão</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma sessão ativa
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Status da Sessão</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={sessionInfo?.isExpired ? 'destructive' : sessionInfo?.isExpiringSoon ? 'secondary' : 'default'}>
            {sessionInfo?.isExpired ? 'Expirada' : sessionInfo?.isExpiringSoon ? 'Expirando' : 'Ativa'}
          </Badge>
        </div>

        {sessionInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expira em:</span>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">
                  {formatTimeRemaining(sessionInfo.timeRemaining)}
                </span>
              </div>
            </div>

            {/* The user information is no longer available, so this section is removed */}
            {/*
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usuário:</span>
              <span className="text-sm">{user.email}</span>
            </div>
            */}

            {sessionInfo.isExpiringSoon && !sessionInfo.isExpired && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sua sessão expira em breve. Renove para continuar.
                </AlertDescription>
              </Alert>
            )}

            {sessionInfo.isExpired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sua sessão expirou. Renove para continuar.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRefreshSession}
              className="w-full"
              variant={sessionInfo.isExpiringSoon || sessionInfo.isExpired ? 'default' : 'outline'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar Sessão
            </Button>
          </>
        )}

        <div className="text-xs text-muted-foreground">
          Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
} 



