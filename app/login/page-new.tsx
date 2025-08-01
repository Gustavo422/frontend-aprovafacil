'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoginForm } from '@/features/auth/components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle successful login
  const handleLoginSuccess = () => {
    // The redirection is handled by the AuthProvider
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20">
            <Image
              src="/aprova_facil_logo.png"
              alt="AprovaFácil Logo"
              width={80}
              height={80}
              priority
              className="object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#1e40af]">
              AprovaFácil
            </h1>
            <h2 className="text-2xl font-semibold">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-semibold">Fazer Login</CardTitle>
            <CardDescription>
              Digite seu email e senha para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <LoginForm onSuccess={handleLoginSuccess} />
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {/* Footer content if needed */}
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 AprovaFácil. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}