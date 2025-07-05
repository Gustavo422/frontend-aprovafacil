'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Status de Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Status de Autenticação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Status:</span>
          <Badge variant={user ? 'default' : 'destructive'}>
            {user ? 'Logado' : 'Não logado'}
          </Badge>
        </div>

        {user && (
          <div className="space-y-2">
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>ID:</strong> {user.id}
            </div>
            <div>
              <strong>Nome:</strong>{' '}
              {user.user_metadata?.name || 'Não definido'}
            </div>
            <div>
              <strong>Criado em:</strong>{' '}
              {new Date(user.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div>
              <strong>Último login:</strong>{' '}
              {new Date(
                user.last_sign_in_at || user.created_at
              ).toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 