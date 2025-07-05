'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/features/shared/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(0);
  const { user, loading } = useAuth();

  const redirectedFrom = searchParams?.get('redirectedFrom');
  const reason = searchParams?.get('reason');

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!loading && user) {
      const redirectTo = redirectedFrom || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectedFrom]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const getReasonMessage = () => {
    switch (reason) {
      case 'no_session':
        return 'Sua sessão expirou. Faça login novamente para continuar.';
      case 'token_expired':
        return 'Sua sessão expirou. Faça login novamente para continuar.';
      case 'middleware_error':
        return 'Ocorreu um erro na verificação de autenticação. Tente novamente.';
      default:
        return null;
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded
          setIsBlocked(true);
          setTimeUntilReset(data.error.retryAfter || 900); // 15 minutos padrão
          
          toast({
            variant: 'destructive',
            title: 'Muitas tentativas',
            description: data.error.message,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao fazer login',
            description: data.error.message,
          });
        }
        return;
      }

      if (data.success) {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Redirecionando...',
        });

        // Redirecionar para a página original ou dashboard
        const redirectTo = redirectedFrom || '/dashboard';
        router.push(redirectTo);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao fazer login',
          description: data.error.message,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: 'Ocorreu um erro ao tentar fazer login. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se já está logado, não mostrar a página
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex items-center space-x-3">
                <Image
                  src="/aprova_facil_logo.png"
                  alt="AprovaFácil Logo"
                  width={48}
                  height={48}
                  priority
                  className="object-contain"
                />
                <span className="text-2xl font-black text-[#1e40af]">
                  AprovaFácil
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar sua conta
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {getReasonMessage() && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getReasonMessage()}
                </AlertDescription>
              </Alert>
            )}

            {isBlocked && (
              <Alert variant="destructive" className="mb-4">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Muitas tentativas de login. Tente novamente em:</p>
                    <p className="font-mono text-lg">
                      {formatTimeRemaining(timeUntilReset)}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
                          autoComplete="email"
                          disabled={isBlocked}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isBlocked}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isBlocked}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isBlocked || loginAttempts >= 5}
                  size="lg"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
              </Link>
            </div>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
