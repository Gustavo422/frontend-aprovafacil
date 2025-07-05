import { NextRequest, NextResponse } from 'next/server';
import {
  composeMiddleware,
  withApiErrorHandler,
  withAuthValidation,
  withRateLimit,
  withInputValidation,
} from '@/middleware/error-handler';
import { createValidationError, withErrorHandling } from '@/lib/error-utils';
import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Exemplo de validador
function validateUserData(data: Record<string, unknown>) {
  const errors: string[] = [];

  if (
    !data.name ||
    typeof data.name !== 'string' ||
    data.name.trim().length < 2
  ) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (
    !data.email ||
    typeof data.email !== 'string' ||
    !data.email.includes('@')
  ) {
    errors.push('Email deve ser válido');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Handler principal da API
async function handleGet(_request: NextRequest) {
  const supabase = await createRouteHandlerClient();

  try {
    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Exemplo de consulta com dados tipados
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Erro na consulta', { error: error.message });
      return NextResponse.json({ error: 'Erro na consulta' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Erro interno', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handlePost(request: NextRequest) {
  return await withErrorHandling(
    async () => {
      const body = await request.json();

      // Validação manual adicional
      if (!body.name) {
        throw createValidationError('Nome é obrigatório', 'name');
      }

      // Simular criação de usuário
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(newUser, { status: 201 });
    },
    { operation: 'createUser' }
  );
}

// Exportar handlers com middlewares aplicados
export const GET = composeMiddleware(handleGet, [
  withApiErrorHandler,
  handler =>
    withRateLimit(handler, { maxRequests: 50, windowMs: 5 * 60 * 1000 }), // 50 requests por 5 minutos
]);

export const POST = composeMiddleware(handlePost, [
  withApiErrorHandler,
  withAuthValidation,
  handler =>
    withRateLimit(handler, { maxRequests: 10, windowMs: 5 * 60 * 1000 }), // 10 requests por 5 minutos
  handler => withInputValidation(handler, validateUserData),
]);
