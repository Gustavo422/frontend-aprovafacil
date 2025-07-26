'use client';

import { zodResolver } from '@hookform/resolvers/zod';
// import { useRouter, useSearchParams } from 'next/navigation'; // Removido - não usado
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  Carddescricao,
  CardFooter,
  CardHeader,
  Cardtitulo,
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
import { Alert, Alertdescricao } from '@/components/ui/alert';
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
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setTimeUntilReset(300); // 5 minutos
          toast({
            title: 'Muitas tentativas de login',
            descricao: 'Sua conta foi temporariamente bloqueada por 5 minutos.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao fazer login',
            descricao: result.error,
            variant: 'destructive',
          });
        }
        return;
      }

      // Sucesso: salvar também em cookie para middleware server-side
      if (result.token) {
        document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      toast({
        title: 'Login realizado com sucesso!',
        descricao: 'Bem-vindo de volta ao AprovaFácil.',
      });
      
      // O redirecionamento já é feito pelo AuthProvider
    } catch (error: unknown) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setTimeUntilReset(300); // 5 minutos
        toast({
          title: 'Muitas tentativas de login',
          descricao: 'Sua conta foi temporariamente bloqueada por 5 minutos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao fazer login',
          descricao: error instanceof Error ? error.message : 'Email ou senha incorretos',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
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
            <Cardtitulo className="text-xl font-semibold">Fazer Login</Cardtitulo>
            <Carddescricao>
              Digite seu email e senha para continuar
            </Carddescricao>
          </CardHeader>
          
          <CardContent>
            {isBlocked && (
              <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                <Lock className="h-4 w-4" />
                <Alertdescricao>
                  Conta temporariamente bloqueada. Tempo restante: {formatTime(timeUntilReset)}
                </Alertdescricao>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground"></div>
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
                <Alertdescricao className="text-sm">
                  Tentativa {loginAttempts} de 3. Após 3 tentativas, sua conta será temporariamente bloqueada.
                </Alertdescricao>
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