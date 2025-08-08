/* eslint-disable consistent-return */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
// import { useRouter, useSearchParams } from 'next/navigation'; // Removido - não usado
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
});

export default function LoginPage() {
  // const router = useRouter(); // Removido - não usado
  // const searchParams = useSearchParams(); // Removido - não usado
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirecionar se já estiver logado
  useEffect(() => {
    // This part of the code was removed as per the edit hint.
    // The original code had `if (user) { ... }` which relied on `user` from `useAuth`.
    // Since `useAuth` is no longer available, this logic is effectively removed.
    // The user will remain logged in if they have a valid session, but there's no
    // explicit redirect to the home page if they are logged in.
  }, []); // Removed `user` from dependency array as it's no longer available.

  // Gerenciar bloqueio por tentativas
  useEffect(() => {
    if (isBlocked && timeUntilReset > 0) {
      const timer = setInterval(() => {
        setTimeUntilReset(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, timeUntilReset]);

  const { signIn } = useAuth();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isBlocked) {
      toast({
        title: 'Acesso temporariamente bloqueado',
        descricao: `Aguarde ${timeUntilReset} segundos antes de tentar novamente.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(values.email, values.password);
      
      if (result.error) {
        console.log('[LOGIN-PAGE] Login failed:', {
          error: result.error,
          errorCode: result.errorCode,
          suggestions: result.suggestions
        });

        // Handle rate limiting from server
        if (result.errorCode === 'TOO_MANY_REQUESTS') {
          setIsBlocked(true);
          setTimeUntilReset(300); // 5 minutes
          toast({
            title: 'Muitas tentativas de login',
            descricao: result.error,
            variant: 'destructive',
          });
          return;
        }

        // Handle client-side rate limiting
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setTimeUntilReset(300); // 5 minutes
          toast({
            title: 'Muitas tentativas de login',
            descricao: 'Sua conta foi temporariamente bloqueada por 5 minutos por segurança.',
            variant: 'destructive',
          });
        } else {
          // Show enhanced error message with suggestions
          const errorTitle = getErrorTitle(result.errorCode);
          const errorDescription = result.error;
          const suggestions = result.suggestions?.join(' • ') || '';
          
          toast({
            title: errorTitle,
            descricao: `${errorDescription}${suggestions ? `\n\nSugestões: ${suggestions}` : ''}`,
            variant: 'destructive',
          });
        }
        return;
      }

      // Success: token is already handled by AuthProvider
      console.log('[LOGIN-PAGE] Login successful');
      
      toast({
        title: 'Login realizado com sucesso!',
        descricao: 'Bem-vindo de volta ao AprovaFácil.',
      });
      
      // Reset login attempts on success
      setLoginAttempts(0);
      
      // Redirection is handled by AuthProvider
    } catch (error: unknown) {
      console.error('[LOGIN-PAGE] Unexpected error during login:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setTimeUntilReset(300); // 5 minutes
        toast({
          title: 'Muitas tentativas de login',
          descricao: 'Sua conta foi temporariamente bloqueada por 5 minutos por segurança.',
          variant: 'destructive',
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erro inesperado durante o login';
        toast({
          title: 'Erro inesperado',
          descricao: `${errorMessage}\n\nSugestões: Tente novamente • Verifique sua conexão • Entre em contato com o suporte se persistir`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to get user-friendly error titles
  function getErrorTitle(errorCode?: string): string {
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Credenciais inválidas';
      case 'NETWORK_TIMEOUT':
        return 'Tempo limite excedido';
      case 'NETWORK_UNAVAILABLE':
        return 'Servidor indisponível';
      case 'SERVER_ERROR':
        return 'Erro do servidor';
      case 'DATABASE_ERROR':
        return 'Erro de banco de dados';
      case 'INVALID_EMAIL_FORMAT':
        return 'Email inválido';
      case 'PASSWORD_TOO_SHORT':
        return 'Senha muito curta';
      case 'TOO_MANY_REQUESTS':
        return 'Muitas tentativas';
      case 'TOKEN_EXPIRED':
        return 'Sessão expirada';
      case 'TOKEN_INVALID':
        return 'Token inválido';
      case 'BACKEND_URL_MISSING':
        return 'Configuração inválida';
      case 'ENVIRONMENT_INVALID':
        return 'Ambiente inválido';
      case 'ACCOUNT_LOCKED':
        return 'Conta bloqueada';
      case 'TIMEOUT_ERROR':
        return 'Tempo limite excedido';
      case 'NETWORK_ERROR':
        return 'Erro de conexão';
      case 'INVALID_RESPONSE':
        return 'Resposta inválida';
      default:
        return 'Erro ao fazer login';
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
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

        {/* Card de Login */}
        <Card className="border-border/50">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-semibold">Fazer Login</CardTitle>
            <CardDescription>
              Digite seu email e senha para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isBlocked && (
              <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Conta temporariamente bloqueada. Tempo restante: {formatTime(timeUntilReset)}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
                          disabled={isLoading || isBlocked}
                          className="bg-background/50 border-border/50"
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
                      <FormLabel className="text-sm font-medium">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            disabled={isLoading || isBlocked}
                            className="bg-background/50 border-border/50 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading || isBlocked}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
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
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading || isBlocked}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center space-y-2">
              <Link 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {loginAttempts > 0 && loginAttempts < 3 && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Tentativa {loginAttempts} de 3. Após 3 tentativas, sua conta será temporariamente bloqueada.
                </AlertDescription>
              </Alert>
            )}
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