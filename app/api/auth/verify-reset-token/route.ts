import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    // Validação básica
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { 
          valid: false,
          error: { 
            code: 'MISSING_TOKENS', 
            message: 'Tokens de acesso são obrigatórios' 
          } 
        },
        { status: 400 }
      );
    }

    try {
      // Definir a sessão com os tokens fornecidos
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.user) {
        logger.warn('Token de reset inválido', {
          error: error?.message,
          hasUser: !!data.user
        });

        return NextResponse.json({
          valid: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token inválido ou expirado'
          }
        });
      }

      logger.info('Token de reset verificado com sucesso', {
        userId: data.user.id
      });

      return NextResponse.json({
        valid: true,
        user: {
          id: data.user.id,
          email: data.user.email
        }
      });

    } catch (tokenError) {
      logger.warn('Erro ao verificar token de reset', {
        error: tokenError
      });

      return NextResponse.json({
        valid: false,
        error: {
          code: 'TOKEN_VERIFICATION_FAILED',
          message: 'Falha na verificação do token'
        }
      });
    }

  } catch (error) {
    logger.error('Erro inesperado na verificação de token', { error });
    
    return NextResponse.json(
      { 
        valid: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Erro interno do servidor. Tente novamente.' 
        } 
      },
      { status: 500 }
    );
  }
}

