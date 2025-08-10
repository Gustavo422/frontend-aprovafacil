import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

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
  '/api/concursos'
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
    // Verificar se o usuário está autenticado via API
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!authResponse.ok) {
      // Usuário não autenticado, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const authData = await authResponse.json();
    const user = authData.user;
    
    if (!user) {
      // Usuário não autenticado, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verificar se o usuário tem concurso selecionado via API
    const preferenceResponse = await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });
    
    if (!preferenceResponse.ok) {
      // Usuário não tem concurso selecionado, redirecionar para home
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const preference = await preferenceResponse.json();
    
    if (!preference?.ativo) {
      // Usuário não tem concurso selecionado, redirecionar para home
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Verificar se o concurso ainda existe e está ativo via API
    const concursoResponse = await fetch(`${request.nextUrl.origin}/api/concursos/${preference.concurso_id}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });
    
    if (!concursoResponse.ok) {
      // Concurso não existe ou não está ativo, limpar preferência e redirecionar
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'DELETE',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': `Bearer ${authData.access_token}`,
        },
      });
      
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const concurso = await concursoResponse.json();
    
    if (!concurso?.ativo) {
      // Concurso não está ativo, limpar preferência e redirecionar
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'DELETE',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': `Bearer ${authData.access_token}`,
        },
      });
      
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Verificar se a categoria do concurso ainda existe e está ativa via API
    const categoriaResponse = await fetch(`${request.nextUrl.origin}/api/concurso-categorias/${concurso.categoria_id}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });
    
    if (!categoriaResponse.ok) {
      // Categoria não existe ou não está ativa, limpar preferência e redirecionar
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'DELETE',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': `Bearer ${authData.access_token}`,
        },
      });
      
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const categoria = await categoriaResponse.json();
    
    if (!categoria?.ativo) {
      // Categoria não está ativa, limpar preferência e redirecionar
      await fetch(`${request.nextUrl.origin}/api/user/concurso-preference`, {
        method: 'DELETE',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': `Bearer ${authData.access_token}`,
        },
      });
      
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Tudo OK, permitir acesso
    return null;
    
  } catch {
    // Em caso de erro, redirecionar para home
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route }/`)
  );
}

function isApiPublicRoute(pathname: string): boolean {
  return API_PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route }/`)
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
      pathname.startsWith('/apostilas') || 
      pathname.startsWith('/plano-estudos') || 
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



