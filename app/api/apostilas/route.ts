import { extractAuthToken } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter preferência do usuário para extrair categoria/concurso
    const prefRes = await fetch(`${process.env.BACKEND_API_URL}/api/user/concurso-preference`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!prefRes.ok) {
      return NextResponse.json({ apostilas: [] }, { status: 200 });
    }

    const prefData = await prefRes.json();
    const concursoId = prefData?.data?.concurso_id;
    const categoriaId = prefData?.data?.categoria_id;

    if (!concursoId || !categoriaId) {
      return NextResponse.json({ apostilas: [] }, { status: 200 });
    }

    // Buscar conteúdo filtrado e extrair apenas apostilas
    const query = new URLSearchParams({ concurso_id: concursoId, categoria_id: categoriaId }).toString();
    const conteudoUrl = `${process.env.BACKEND_API_URL}/api/conteudo/filtrado?${query}`;
    const conteudoRes = await fetch(conteudoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!conteudoRes.ok) {
      return NextResponse.json({ apostilas: [] }, { status: 200 });
    }

    const conteudoData = await conteudoRes.json();
    const apostilas = conteudoData?.data?.apostilas ?? [];
    return NextResponse.json({ apostilas }, { status: 200 });
  } catch (error) {
    logger.error('Erro ao buscar apostilas:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { apostilas: [] },
      { status: 200 }
    );
  }
}

export async function POST(_request: Request) {
  // CRUD de apostilas desativado
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}