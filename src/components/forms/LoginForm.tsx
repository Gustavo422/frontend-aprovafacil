import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './FormField';
import { useAuth } from '../../hooks/useAuth';

/**
 * Schema de validação para login
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  lembrarMe: z.boolean().optional()
});

/**
 * Tipo dos dados do formulário
 */
type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Props do componente
 */
interface LoginFormProps {
  /**
   * Callback executado após login bem-sucedido
   */
  onSuccess?: () => void;
  
  /**
   * Callback executado em caso de erro
   */
  onError?: (error: Error) => void;
  
  /**
   * Se deve mostrar link para registro
   */
  showRegisterLink?: boolean;
  
  /**
   * Se deve mostrar opção "Lembrar-me"
   */
  showRememberMe?: boolean;
  
  /**
   * Se deve mostrar link "Esqueci minha senha"
   */
  showForgotPassword?: boolean;
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Componente de formulário de login
 */
export function LoginForm({
  onSuccess,
  onError,
  showRegisterLink = true,
  showRememberMe = true,
  showForgotPassword = true,
  className = ''
}: LoginFormProps) {
  const { login, loginStatus } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Configurar formulário
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
      lembrarMe: false
    }
  });
  
  // Submeter formulário
  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors();
      
      await login({
        email: data.email,
        senha: data.senha
      });
      
      // Salvar preferência de "lembrar-me" se necessário
      if (data.lembrarMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }
      
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro no login');
      
      // Verificar tipo de erro e definir erro específico no campo
      if (err.message.includes('email') || err.message.includes('Email')) {
        setError('email', { message: err.message });
      } else if (err.message.includes('senha') || err.message.includes('Senha')) {
        setError('senha', { message: err.message });
      } else {
        setError('root', { message: err.message });
      }
      
      onError?.(err);
    }
  };
  
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Título */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar estudando
          </p>
        </div>
        
        {/* Erro geral */}
        {errors.root && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              {errors.root.message}
            </div>
          </div>
        )}
        
        {/* Campo de email */}
        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="seu@email.com"
          error={errors.email}
          required
          autoComplete="email"
          disabled={isSubmitting || loginStatus.isLoading}
        />
        
        {/* Campo de senha */}
        <div className="relative">
          <Input
            {...register('senha')}
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="Sua senha"
            error={errors.senha}
            required
            autoComplete="current-password"
            disabled={isSubmitting || loginStatus.isLoading}
          />
          
          {/* Botão para mostrar/ocultar senha */}
          <button
            type="button"
            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting || loginStatus.isLoading}
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Opções adicionais */}
        <div className="flex items-center justify-between">
          {showRememberMe && (
            <div className="flex items-center">
              <input
                {...register('lembrarMe')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting || loginStatus.isLoading}
              />
              <label className="ml-2 block text-sm text-gray-900">
                Lembrar-me
              </label>
            </div>
          )}
          
          {showForgotPassword && (
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
              >
                Esqueceu sua senha?
              </a>
            </div>
          )}
        </div>
        
        {/* Botão de submit */}
        <button
          type="submit"
          disabled={isSubmitting || loginStatus.isLoading}
          className="
            group relative w-full flex justify-center py-3 px-4 border border-transparent 
            text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition ease-in-out duration-150
          "
        >
          {(isSubmitting || loginStatus.isLoading) && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {(isSubmitting || loginStatus.isLoading) ? 'Entrando...' : 'Entrar'}
        </button>
        
        {/* Link para registro */}
        {showRegisterLink && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <a
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
              >
                Cadastre-se gratuitamente
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}