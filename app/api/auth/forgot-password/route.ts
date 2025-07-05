import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    
    const body = await request.json();
    const { email } = body;

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_EMAIL', 
            message: 'E-mail é obrigatório' 
          } 
        },
        { status: 400 }
      );
    }

    // Rate limiting por IP para reset de senha
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitKey = `forgot-password:${clientIP}`;
    
    if (!rateLimiter.isAllowed(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 tentativas por hora
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey);
      const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));
      
      logger.warn('Tentativa de reset de senha bloqueada por rate limiting', {
        ip: clientIP,
        email,
        timeUntilReset
      });

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: `Muitas tentativas de redefinição. Tente novamente em ${minutesUntilReset} minutos.`,
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

    // Solicitar reset de senha
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      logger.warn('Erro ao solicitar reset de senha', {
        ip: clientIP,
        email,
        error: error.message
      });

      // Por segurança, não revelamos se o e-mail existe ou não
      return NextResponse.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
      });
    }

    logger.info('Reset de senha solicitado', {
      email,
      ip: clientIP
    });

    return NextResponse.json({
      success: true,
      message: 'E-mail de redefinição enviado com sucesso.'
    });

  } catch (error) {
    logger.error('Erro inesperado no reset de senha', { error });
    
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

