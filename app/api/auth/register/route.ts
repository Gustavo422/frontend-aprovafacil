import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    
    const body = await request.json();
    const { email, password, name } = body;

    // Validação básica
    if (!email || !password || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_FIELDS', 
            message: 'Email, senha e nome são obrigatórios' 
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

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EMAIL_ALREADY_EXISTS', 
            message: 'Este email já está cadastrado' 
          } 
        },
        { status: 409 }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: name,
        },
      },
    });

    if (authError) {
      logger.warn('Erro ao criar usuário no Supabase Auth', {
        email,
        error: authError.message
      });

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTH_SIGNUP_FAILED', 
            message: authError.message 
          } 
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'USER_CREATION_FAILED', 
            message: 'Falha ao criar usuário' 
          } 
        },
        { status: 500 }
      );
    }

    // Criar perfil do usuário na tabela users
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        email,
        nome: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_questions_answered: 0,
        total_correct_answers: 0,
        study_time_minutes: 0,
        average_score: 0,
      },
    ]);

    if (profileError) {
      logger.error('Erro ao criar perfil do usuário', {
        userId: authData.user.id,
        email,
        error: profileError.message
      });

      // Tentar remover o usuário do Auth se o perfil falhou
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        logger.error('Erro ao limpar usuário após falha no perfil', {
          userId: authData.user.id,
          error: cleanupError
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'PROFILE_CREATION_FAILED', 
            message: 'Erro ao criar perfil do usuário' 
          } 
        },
        { status: 500 }
      );
    }

    logger.info('Usuário registrado com sucesso', {
      userId: authData.user.id,
      email,
      nome: name
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso. Verifique seu email para confirmar a conta.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        nome: name,
        emailConfirmed: !!authData.user.email_confirmed_at
      }
    });

  } catch (error) {
    logger.error('Erro inesperado no registro', { error });
    
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

