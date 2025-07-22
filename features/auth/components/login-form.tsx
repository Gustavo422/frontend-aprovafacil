'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/features/shared/hooks/use-toast';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
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
import { Alert, Alertdescricao } from '@/components/ui/alert';
import Link from 'next/link';

// Form validation schema
const loginFormSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
});

// Type for form values
type LoginFormValues = z.infer<typeof loginFormSchema>;

// Props interface
interface LoginFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // State hooks
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(0);
  
  // Auth and toast hooks
  const { signIn } = useAuth();
  const { toast } = useToast();

  // Form setup
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  async function onSubmit(values: LoginFormValues) {
    // Check if login is blocked
    if (isBlocked) {
      toast({
        title: 'Acesso temporariamente bloqueado',
        descricao: `Aguarde ${formatTime(timeUntilReset)} antes de tentar novamente.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Attempt login
      const result = await signIn(values.email, values.password);
      
      if (result.error) {
        // Handle failed login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Block after 3 attempts
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setTimeUntilReset(300); // 5 minutes
          startBlockTimer();
          
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

      // Success: store token in cookie for server-side middleware
      if (result.token) {
        document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      toast({
        title: 'Login realizado com sucesso!',
        descricao: 'Bem-vindo de volta.',
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: unknown) {
      // Handle errors
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setTimeUntilReset(300); // 5 minutes
        startBlockTimer();
        
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

  // Start timer for blocked login
  function startBlockTimer() {
    const timer = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlocked(false);
          setLoginAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Format time for display
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="w-full space-y-6">
      {/* Show block alert if user is blocked */}
      {isBlocked && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <Lock className="h-4 w-4" />
          <Alertdescricao>
            Conta temporariamente bloqueada. Tempo restante: {formatTime(timeUntilReset)}
          </Alertdescricao>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
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
                    disabled={isLoading || isBlocked}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Password field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLoading || isBlocked}
                      className="pr-10"
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

          {/* Login button */}
          <Button
            type="submit"
            className="w-full"
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
          
          {/* Helper links */}
          <div className="flex flex-col space-y-2 text-sm text-center">
            <Link 
              href="/forgot-password" 
              className="text-muted-foreground hover:text-foreground"
            >
              Esqueceu sua senha?
            </Link>
            <div className="text-muted-foreground">
              Não tem uma conta?{' '}
              <Link 
                href="/register" 
                className="text-primary font-medium hover:text-primary/80"
              >
                Cadastre-se
              </Link>
            </div>
          </div>
          
          {/* Login attempts warning */}
          {loginAttempts > 0 && loginAttempts < 3 && (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertCircle className="h-4 w-4" />
              <Alertdescricao className="text-sm">
                Tentativa {loginAttempts} de 3. Após 3 tentativas, sua conta será temporariamente bloqueada.
              </Alertdescricao>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  );
}