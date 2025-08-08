'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Loader2, Monitor, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  email: string;
  nome: string;
  role?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
  error?: string;
  errorCode?: string;
  requiresPasswordChange?: boolean;
  securityWarning?: string;
}

interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

export default function EnhancedLogin() {
  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Informações do dispositivo
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Detectar informações do dispositivo
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const fingerprint = generateFingerprint();
      
      const detectedDevice: DeviceInfo = {
        fingerprint,
        name: getDeviceName(userAgent),
        type: getDeviceType(userAgent),
        browser: getBrowserName(userAgent),
        os: getOSName(userAgent)
      };

      setDeviceInfo(detectedDevice);
    };

    detectDevice();
  }, []);

  const generateFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      `${screen.width }x${ screen.height}`,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    return btoa(fingerprint).substring(0, 32);
  };

  const getDeviceName = (userAgent: string): string => {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS Device';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Windows')) return 'Windows Computer';
    if (userAgent.includes('Mac')) return 'Mac Computer';
    if (userAgent.includes('Linux')) return 'Linux Computer';
    return 'Unknown Device';
  };

  const getDeviceType = (userAgent: string): 'desktop' | 'mobile' | 'tablet' => {
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    if (/Mobile|iPhone|Android/.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getOSName = (userAgent: string): string => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  };

  const validateForm = (): string | null => {
    if (!email) return 'Email é obrigatório';
    if (!email.includes('@')) return 'Email inválido';
    if (!password) return 'Senha é obrigatória';
    if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSecurityWarning(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          senha: password,
          rememberMe,
          deviceName: deviceInfo?.name,
          deviceFingerprint: deviceInfo?.fingerprint
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        setSuccess('Login realizado com sucesso!');
        
        // Mostrar aviso de segurança se houver
        if (data.securityWarning) {
          setSecurityWarning(data.securityWarning);
        }

        // Redirecionar após um delay para mostrar o feedback
        setTimeout(() => {
          if (data.requiresPasswordChange) {
            router.push('/change-password');
          } else {
            router.push('/dashboard');
          }
        }, 1500);

      } else {
        setError(data.error || 'Erro no login');
        setLoginAttempts(prev => prev + 1);

        // Atualizar tentativas restantes se fornecido
        if (data.errorCode === 'SECURITY_BLOCK') {
          setRemainingAttempts(0);
        }
      }

    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Monitor className="w-4 h-4" />;
    
    switch (deviceInfo.type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Monitor className="w-4 h-4" />; // ou use um ícone de tablet
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getRemainingAttemptsMessage = () => {
    if (remainingAttempts === null) return null;
    if (remainingAttempts === 0) return 'Conta temporariamente bloqueada por segurança.';
    return `${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">AprovaFácil</CardTitle>
          <CardDescription className="text-center">
            Faça login em sua conta para continuar
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Informações do dispositivo */}
            {deviceInfo && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                {getDeviceIcon()}
                <span>{deviceInfo.name} • {deviceInfo.browser}</span>
              </div>
            )}

            {/* Alertas */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {securityWarning && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>{securityWarning}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Mensagem de tentativas */}
            {getRemainingAttemptsMessage() && (
              <div className="text-sm text-orange-600 text-center">
                {getRemainingAttemptsMessage()}
              </div>
            )}

            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                className="w-full"
                autoComplete="email"
                required
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  disabled={isLoading}
                  className="w-full pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar-me por 30 dias
              </label>
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || remainingAttempts === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Esqueceu sua senha?
            </a>
          </div>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">Não tem uma conta? </span>
            <a href="/register" className="text-sm text-blue-600 hover:underline">
              Cadastre-se
            </a>
          </div>

          {/* Indicador de tentativas */}
          {loginAttempts > 0 && (
            <div className="text-xs text-gray-400 text-center">
              {loginAttempts} tentativa{loginAttempts > 1 ? 's' : ''} de login
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 