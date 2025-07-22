'use client';

import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, Carddescricao, CardFooter, CardHeader, Cardtitulo } from '@/components/ui/card';

export default function ProtectedExamplePage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Protected Page Example</h1>
        <p className="text-muted-foreground mb-8">
          This page is only accessible to authenticated users.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Cardtitulo>User Information</Cardtitulo>
              <Carddescricao>Your authenticated user details</Carddescricao>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {user.nome}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role || 'user'}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={signOut}>Sign Out</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Cardtitulo>Protected Route Features</Cardtitulo>
              <Carddescricao>Key capabilities of the ProtectedRoute component</Carddescricao>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Authentication verification</li>
                <li>Role-based access control</li>
                <li>Automatic redirection to login</li>
                <li>Return URL preservation</li>
                <li>Custom loading state support</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}