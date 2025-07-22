import { NextRequest, NextResponse } from 'next/server';

// ========================================
// ROTAS QUE NÃO PRECISAM DE CONCURSO SELECIONADO
// ========================================

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/auth',
  '/api/auth',
  '/api/user/concurso-preference',
  '/api/concurso-categorias',
  '/api/concursos',
  '/onboarding',
  '/selecionar-concurso',
  '/forgot-password',
  '/reset-password'
];

const API_PUBLIC_ROUTES = [
  '/api/auth',
  '/api/user/concurso-preference',
  '/api/concurso-categorias',
  '/api/concursos',
  '/api/health'
];

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function verificarConcursoSelecionado(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota pública
  if (isPublicRoute(pathname)) {
    return null; // Permitir acesso
  }
  
  // Verificar se é uma rota de API pública
  if (isApiPublicRoute(pathname)) {
    return null; // Permitir acesso
  }
  
  try {
    // NOVO: Buscar token JWT do backend salvo em cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      // Usuário não autenticado, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Usar o token JWT do backend para autenticação nas requisições
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // Verificar se o usuário tem concurso selecionado via API
    const preferenceResponse = await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
      headers: authHeader
    });
    if (!preferenceResponse.ok) {
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    const preference = await preferenceResponse.json();
    if (!preference || !preference.ativo) {
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    // Verificar se o concurso ainda existe e está ativo via API
    const concursoResponse = await fetch(`${request.nextUrl.origin}/api/concursos/${preference.concurso_id}`, {
      headers: authHeader
    });
    if (!concursoResponse.ok) {
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false })
      });
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    const concurso = await concursoResponse.json();
    if (!concurso || !concurso.ativo) {
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false })
      });
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    // Verificar se a categoria do concurso ainda existe e está ativa via API
    const categoriaResponse = await fetch(`${request.nextUrl.origin}/api/concurso-categorias/${concurso.categoria_id}`, {
      headers: authHeader
    });
    if (!categoriaResponse.ok) {
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false })
      });
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    const categoria = await categoriaResponse.json();
    if (!categoria || !categoria.ativo) {
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false })
      });
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    // Tudo OK, permitir acesso
    return null;
  } catch (error) {
    return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isApiPublicRoute(pathname: string): boolean {
  return API_PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// ========================================
// MIDDLEWARE PRINCIPAL
// ========================================

export async function middleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota que precisa de verificação
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/simulados') || 
      pathname.startsWith('/flashcards') || 
      pathname.startsWith('/cartoes-memorizacao') ||
      pathname.startsWith('/apostila-customizada') ||
      pathname.startsWith('/mapa-materias') ||
      pathname.startsWith('/questoes-semanais') ||
      pathname.startsWith('/plano-estudos') || 
      pathname.startsWith('/cronograma') ||
      pathname.startsWith('/guru-da-aprovacao') ||
      pathname.startsWith('/configuracoes') ||
      pathname.startsWith('/api/') && !isApiPublicRoute(pathname)) {
    
    return await verificarConcursoSelecionado(request);
  }
  
  return null;
}

// ========================================
// CONFIGURAÇÃO DO MIDDLEWARE
// ========================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 



