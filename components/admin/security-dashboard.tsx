'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Monitor, 
  Ban,
  Globe,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SecurityStats {
  totalAttempts: number;
  totalBlocks: number;
  uniqueIPs: number;
  timeframe: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  deviceFingerprint?: string;
  attemptedAt: string;
  location?: string;
}

interface SecurityBlock {
  id: string;
  ipAddress?: string;
  email?: string;
  blockType: 'ip' | 'email' | 'user';
  blockedUntil: string;
  reason: string;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  usuarioId: string;
  userEmail: string;
  deviceInfo: {
    deviceName?: string;
    [key: string]: unknown;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  active: boolean;
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<LoginAttempt[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<SecurityBlock[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day' | 'week'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSecurityData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, attemptsRes, blocksRes, sessionsRes] = await Promise.all([
        fetch(`/api/admin/security/stats?timeframe=${selectedTimeframe}`, { credentials: 'include' }),
        fetch('/api/admin/security/attempts?limit=50', { credentials: 'include' }),
        fetch('/api/admin/security/blocks', { credentials: 'include' }),
        fetch('/api/admin/security/sessions', { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setRecentAttempts(attemptsData.data || []);
      }

      if (blocksRes.ok) {
        const blocksData = await blocksRes.json();
        setActiveBlocks(blocksData.data || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData.data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
      setError('Erro ao carregar dados de segurança');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    loadSecurityData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeframe, loadSecurityData]);

  const unblockIP = async (blockId: string) => {
    try {
      const response = await fetch(`/api/admin/security/blocks/${blockId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadSecurityData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao desbloquear:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/security/sessions/${sessionId}/revoke`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        loadSecurityData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const getDeviceIcon = (userAgent: string) => {
    if (/Mobile|iPhone|Android/.test(userAgent)) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getRiskBadge = (attempt: LoginAttempt) => {
    if (attempt.success) {
      return <Badge variant="outline" className="text-green-600">Sucesso</Badge>;
    }
    
    if (attempt.failureReason?.includes('bloqueado')) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    return <Badge variant="secondary">Falha</Badge>;
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando dados de segurança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          <p className="text-gray-600">Monitore atividades de login e segurança do sistema</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'hour' | 'day' | 'week')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="hour">Última Hora</option>
            <option value="day">Último Dia</option>
            <option value="week">Última Semana</option>
          </select>
          <Button onClick={loadSecurityData} size="sm">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tentativas de Login</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Nos últimos {stats.timeframe === 'hour' ? 'hora' : stats.timeframe === 'day' ? 'dia' : 'semana'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqueios Ativos</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBlocks}</div>
              <p className="text-xs text-muted-foreground">
                IPs e emails bloqueados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
              <p className="text-xs text-muted-foreground">
                Endereços diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários conectados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo Principal */}
      <Tabs defaultValue="attempts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attempts">Tentativas de Login</TabsTrigger>
          <TabsTrigger value="blocks">Bloqueios Ativos</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
        </TabsList>

        {/* Tentativas de Login */}
        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <CardTitle>Tentativas de Login Recentes</CardTitle>
              <CardDescription>
                Últimas 50 tentativas de login registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Horário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          {attempt.email}
                        </TableCell>
                        <TableCell>{attempt.ipAddress}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(attempt.userAgent)}
                            <span className="truncate max-w-32" title={attempt.userAgent}>
                              {attempt.userAgent.split(' ')[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(attempt)}
                        </TableCell>
                        <TableCell>
                          {formatTimeAgo(attempt.attemptedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bloqueios Ativos */}
        <TabsContent value="blocks">
          <Card>
            <CardHeader>
              <CardTitle>Bloqueios de Segurança Ativos</CardTitle>
              <CardDescription>
                IPs e emails atualmente bloqueados por motivos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBlocks.map((block) => (
                      <TableRow key={block.id}>
                        <TableCell>
                          <Badge variant={block.blockType === 'ip' ? 'destructive' : 'secondary'}>
                            {block.blockType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {block.ipAddress || block.email}
                        </TableCell>
                        <TableCell>{block.reason}</TableCell>
                        <TableCell>
                          {formatTimeAgo(block.blockedUntil)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unblockIP(block.id)}
                          >
                            Desbloquear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessões Ativas */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Usuários atualmente conectados ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.userEmail}
                        </TableCell>
                        <TableCell>{session.ipAddress}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(session.userAgent)}
                            <span>{session.deviceInfo?.deviceName || 'Dispositivo Desconhecido'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatTimeAgo(session.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeSession(session.id)}
                          >
                            Revogar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 