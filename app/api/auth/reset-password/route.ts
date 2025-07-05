import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    
    const body = await request.json();
    const { password, accessToken, refreshToken } = body;

    // Validação básica
    if (!password || !accessToken || !refreshToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Senha e tokens são obrigatórios' 
          } 
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'A senha deve ter pelo menos 6 caracteres' 
          } 
        },
        { status: 400 }
      );
    }

    try {
      // Definir a sessão com os tokens fornecidos
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !sessionData.user) {
        logger.warn('Falha ao definir sessão para reset de senha', {
          error: sessionError?.message
        });

        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'INVALID_SESSION', 
              message: 'Sessão inválida ou expirada. Solicite um novo link.' 
            } 
          },
          { status: 401 }
        );
      }

      // Atualizar a senha
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        logger.warn('Erro ao atualizar senha', {
          userId: sessionData.user.id,
          error: error.message
        });

        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'PASSWORD_UPDATE_FAILED', 
              message: 'Falha ao atualizar senha. Tente novamente.' 
            } 
          },
          { status: 400 }
        );
      }

      if (data.user) {
        logger.info('Senha redefinida com sucesso', {
          userId: data.user.id,
          email: data.user.email
        });

        return NextResponse.json({
          success: true,
          message: 'Senha redefinida com sucesso.',
          user: {
            id: data.user.id,
            email: data.user.email
          }
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RESET_FAILED', 
            message: 'Falha ao redefinir senha. Tente novamente.' 
          } 
        },
        { status: 500 }
      );

    } catch (resetError) {
      logger.error('Erro durante reset de senha', {
        error: resetError
      });

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RESET_ERROR', 
            message: 'Erro durante redefinição de senha. Tente novamente.' 
          } 
        },
        { status: 500 }
      );
    }

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

