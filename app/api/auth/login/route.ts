import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    
    const body = await request.json();
    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_CREDENTIALS', 
            message: 'Email e senha são obrigatórios' 
          } 
        },
        { status: 400 }
      );
    }

    // Rate limiting por IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitKey = `login:${clientIP}`;
    
    if (!rateLimiter.isAllowed(rateLimitKey, 5, 15 * 60 * 1000)) { // 5 tentativas em 15 minutos
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey);
      const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));
      
      logger.warn('Tentativa de login bloqueada por rate limiting', {
        ip: clientIP,
        email,
        timeUntilReset
      });

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: `Muitas tentativas de login. Tente novamente em ${minutesUntilReset} minutos.`,
            retryAfter: timeUntilReset
          } 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString()
          }
        }
      );
    }

    // Tentativa de login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Tentativa de login falhou', {
        ip: clientIP,
        email,
        error: error.message
      });

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CREDENTIALS', 
            message: 'Email ou senha incorretos',
            remainingAttempts: rateLimiter.getRemainingAttempts(rateLimitKey)
          } 
        },
        { status: 401 }
      );
    }

    if (data.user) {
      // Login bem-sucedido - resetar rate limiting
      rateLimiter.reset(rateLimitKey);
      
      logger.info('Login realizado com sucesso', {
        userId: data.user.id,
        email: data.user.email,
        ip: clientIP
      });

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        },
        session: {
          expiresAt: data.session?.expires_at
        }
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'LOGIN_FAILED', 
          message: 'Falha no login. Tente novamente.' 
        } 
      },
      { status: 500 }
    );

  } catch (error) {
    logger.error('Erro inesperado no login', { error });
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Erro interno do servidor. Tente novamente.' 
        } 
      },
      { status: 500 }
    );
  }
} 