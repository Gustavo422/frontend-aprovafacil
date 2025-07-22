import React from 'react';
import { Card, CardContent, Carddescricao, CardHeader, Cardtitulo } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertNotificationConfig } from '@/components/monitoring/alert-notification-config';

export const metadata = {
  title: 'Alert Configuration | AprovaFácil',
  description: 'Configure performance monitoring alerts',
};

export default function AlertConfigPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuração de Alertas</h1>
        <p className="text-muted-foreground">
          Configure canais de notificação para alertas de performance
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <Cardtitulo>Canais de Notificação</Cardtitulo>
          <Carddescricao>
            Configure como e quando você deseja receber alertas de performance
          </Carddescricao>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="slack">Slack</TabsTrigger>
              <TabsTrigger value="in-app">Notificações no App</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <AlertNotificationConfig channel="email" />
            </TabsContent>
            
            <TabsContent value="slack">
              <AlertNotificationConfig channel="slack" />
            </TabsContent>
            
            <TabsContent value="in-app">
              <AlertNotificationConfig channel="in-app" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}