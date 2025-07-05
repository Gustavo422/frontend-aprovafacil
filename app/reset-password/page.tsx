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
import { Button } from '@/components/ui/button';
import { useToast } from '@/features/shared/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

const formSchema = z.object({
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'A confirmação de senha deve ter pelo menos 6 caracteres.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Verificar se há um token válido na URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setIsValidToken(false);
      return;
    }

    // Verificar se o token é válido
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            refreshToken,
          }),
        });

        const data = await response.json();
        setIsValidToken(data.valid);
      } catch (error) {
        logger.error('Erro ao verificar token:', { 
          error: error instanceof Error ? error.message : String(error)
        });
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: values.password,
          accessToken,
          refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao redefinir senha',
          description: data.error?.message || 'Ocorreu um erro. Tente novamente.',
        });
        return;
      }

      if (data.success) {
        toast({
          title: 'Senha redefinida com sucesso',
          description: 'Você pode agora fazer login com sua nova senha.',
        });
        router.push('/login');
      }
    } catch (error) {
      logger.error('Erro ao redefinir senha:', { 
        error: error instanceof Error ? error.message : String(error)
      });
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
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
                <CardTitle className="text-2xl">Link inválido</CardTitle>
                <CardDescription>
                  O link de redefinição de senha é inválido ou expirou
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este link de redefinição de senha é inválido ou já expirou. 
                  Solicite um novo link para redefinir sua senha.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button asChild className="w-full">
                <Link href="/forgot-password">
                  Solicitar novo link
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  Voltar ao login
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
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
              <CardTitle className="text-2xl">Redefinir senha</CardTitle>
              <CardDescription>
                Digite sua nova senha
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Voltar ao login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

