'use client';

import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, Carddescricao, CardFooter, CardHeader, Cardtitulo } from '@/components/ui/card';

export default function AdminOnlyPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Only Page</h1>
        <p className="text-muted-foreground mb-8">
          This page is only accessible to users with the admin role.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Cardtitulo>Admin Information</Cardtitulo>
              <Carddescricao>Your admin user details</Carddescricao>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {user.nome}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role || 'admin'}</p>
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
              <Cardtitulo>Role-Based Access Control</Cardtitulo>
              <Carddescricao>How the ProtectedRoute component handles roles</Carddescricao>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The ProtectedRoute component checks if the authenticated user has the required role(s) 
                to access this page. If not, they are redirected to the home page with an access denied message.
              </p>
              
              <p>
                This example requires the <code className="bg-muted px-1 rounded">admin</code> role, 
                but you can specify multiple roles like <code className="bg-muted px-1 rounded">[&apos;admin&apos;, &apos;manager&apos;]</code> 
                to allow access to users with any of those roles.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}