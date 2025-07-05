'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { logger } from '@/lib/logger';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar e-mail',
          description: data.error?.message || 'Ocorreu um erro. Tente novamente.',
        });
        return;
      }

      if (data.success) {
        setEmailSent(true);
        toast({
          title: 'E-mail enviado',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
      }
    } catch (error) {
      logger.error('Erro ao solicitar redefinição de senha:', { 
        error: error instanceof Error ? error.message : String(error)
      });
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar e-mail',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
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
                <CardTitle className="text-2xl">E-mail enviado</CardTitle>
                <CardDescription>
                  Verifique sua caixa de entrada
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Enviamos um link para redefinição de senha para o seu e-mail. 
                  Verifique sua caixa de entrada e spam.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Não recebeu o e-mail?{' '}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Tentar novamente
                </button>
              </div>
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
              <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
              <CardDescription>
                Digite seu e-mail para receber um link de redefinição
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
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
                  {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Link>
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

