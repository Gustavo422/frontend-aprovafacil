'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import { 
  Database, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Activity,
  Monitor,
  FileText,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalSimulados: number;
  totalQuestions: number;
  activeUsers: number;
  databaseStatus: 'healthy' | 'warning' | 'error';
}

export default function AdminPage() {
  const [stats] = useState<AdminStats>({
    totalUsers: 0,
    totalSimulados: 0,
    totalQuestions: 0,
    activeUsers: 0,
    databaseStatus: 'healthy'
  });

  const adminFeatures = [
    {
      title: 'Monitor do Banco de Dados',
      description: 'Validação de schema e análise de uso do banco de dados',
      icon: Database,
      href: '/admin/database-monitor',
      color: 'bg-blue-500',
      status: 'active'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar, editar e gerenciar usuários do sistema',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500',
      status: 'coming-soon'
    },
    {
      title: 'Estatísticas do Sistema',
      description: 'Métricas e relatórios de uso da plataforma',
      icon: BarChart3,
      href: '/admin/stats',
      color: 'bg-purple-500',
      status: 'coming-soon'
    },
    {
      title: 'Configurações do Sistema',
      description: 'Configurações globais e parâmetros da aplicação',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-orange-500',
      status: 'coming-soon'
    },
    {
      title: 'Logs do Sistema',
      description: 'Visualizar logs de auditoria e erros',
      icon: FileText,
      href: '/admin/logs',
      color: 'bg-red-500',
      status: 'coming-soon'
    },
    {
      title: 'Segurança',
      description: 'Configurações de segurança e permissões',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-yellow-500',
      status: 'coming-soon'
    }
  ];

  const quickActions = [
    {
      title: 'Validar Schema',
      description: 'Executar validação do banco de dados',
      action: () => window.open('/admin/validate-schema', '_blank'),
      icon: Database,
      color: 'bg-blue-500'
    },
    {
      title: 'Analisar Uso',
      description: 'Analisar uso das tabelas',
      action: () => window.open('/admin/database-usage', '_blank'),
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Limpar Cache',
      description: 'Limpar cache do sistema',
      action: () => window.open('/admin/clear-cache', '_blank'),
      icon: Monitor,
      color: 'bg-purple-500'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'coming-soon':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Em breve</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getAdminData = () => {
    return {
      stats,
      adminFeatures,
      quickActions,
      systemInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie o sistema Concentrify
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Activity className="w-3 h-3 mr-1" />
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +20% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulados</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSimulados}</div>
            <p className="text-xs text-muted-foreground">
              +5 novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              +150 novas questões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={action.action}
                >
                  Executar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Funcionalidades Administrativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {feature.status === 'active' ? (
                  <Button asChild className="w-full">
                    <Link href={feature.href}>
                      Acessar
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Em breve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Banco de Dados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  stats.databaseStatus === 'healthy' ? 'bg-green-500' : 
                  stats.databaseStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="capitalize">{stats.databaseStatus}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Última verificação: há 5 minutos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">CPU</span>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memória</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Disco</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Novo usuário registrado</span>
                <span className="text-xs text-muted-foreground">há 2 minutos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Simulado criado</span>
                <span className="text-xs text-muted-foreground">há 15 minutos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">Backup automático executado</span>
                <span className="text-xs text-muted-foreground">há 1 hora</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Exportação Geral */}
      <div className="flex justify-end pt-6 border-t">
        <ExportJsonButton
          data={getAdminData()}
          filename="admin-dashboard-report"
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
        />
      </div>
    </div>
  );
} 