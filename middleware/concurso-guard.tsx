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
  // rotas removidas: '/onboarding', '/selecionar-concurso'
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
  
  console.log('[DEBUG] Verificando concurso para rota:', pathname);
  
  // Verificar se é uma rota pública
  if (isPublicRoute(pathname)) {
    console.log('[DEBUG] Rota pública, permitindo acesso');
    return null; // Permitir acesso
  }
  
  // Verificar se é uma rota de API pública
  if (isApiPublicRoute(pathname)) {
    console.log('[DEBUG] Rota de API pública, permitindo acesso');
    return null; // Permitir acesso
  }
  
  // Verificação especial removida: página '/selecionar-concurso' não existe mais
  if (false) {
    console.log('[DEBUG] Página de seleção de concurso, verificando se já tem preferência');
    
    try {
      const token = request.cookies.get('auth_token')?.value;
      if (!token) {
        console.log('[DEBUG] Token não encontrado, redirecionando para login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      const authHeader = { 'Authorization': `Bearer ${token}` };
      const preferenceResponse = await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        headers: authHeader
      });
      
      if (preferenceResponse.ok) {
        const preference = await preferenceResponse.json();
        console.log('[DEBUG] Verificação na página de seleção:', {
          hasData: !!preference,
          hasDataData: !!preference?.data,
          isAtivo: preference?.data?.ativo
        });
        
        // Se já tem uma preferência válida, redirecionar para dashboard
        if (preference && preference.data && preference.data.ativo) {
          console.log('[DEBUG] Já tem concurso selecionado, redirecionando para dashboard');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
      
      return null;
    } catch (error) {
      console.log('[DEBUG] Erro na verificação da página de seleção:', error);
      return null; // Em caso de erro, permitir acesso
    }
  }
  
  try {
    // Buscar token JWT do backend salvo em cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      console.log('[DEBUG] Token não encontrado, redirecionando para login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('[DEBUG] Token encontrado, verificando preferência');
    
    // Usar o token JWT do backend para autenticação nas requisições
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // Verificar se o usuário tem concurso selecionado via API
    const preferenceResponse = await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
      headers: authHeader
    });
    
    console.log('[DEBUG] Resposta da API de preferência:', preferenceResponse.status);
    
    // Se o token estiver expirado, redirecionar para login
    if (preferenceResponse.status === 401) {
      console.log('[DEBUG] Token expirado, redirecionando para login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!preferenceResponse.ok) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const preference = await preferenceResponse.json();
    console.log('[DEBUG] Dados da preferência:', {
      hasData: !!preference,
      hasDataData: !!preference?.data,
      isAtivo: preference?.data?.ativo,
      isFallback: preference?.isFallback
    });
    
    // Verificação simplificada: se há dados de preferência (mesmo que seja fallback), permitir acesso
    if (!preference || !preference.data) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log('[DEBUG] Preferência encontrada, permitindo acesso');
    // Tudo OK, permitir acesso
    return null;
  } catch (error) {
    return NextResponse.redirect(new URL('/', request.url));
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



