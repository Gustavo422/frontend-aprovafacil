import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

// ========================================
// ROTAS QUE NÃO PRECISAM DE CONCURSO SELECIONADO
// ========================================

const PUBLIC_ROUTES = [
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
    // Verificar se o usuário está autenticado
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Usuário não autenticado, redirecionar para login
      console.log('Usuário não autenticado, redirecionando para login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verificar se o usuário tem concurso selecionado
    const { data: preference, error: preferenceError } = await supabase
      .from('user_concurso_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (preferenceError || !preference) {
      // Usuário não tem concurso selecionado, redirecionar para seleção
      console.log('Usuário não tem concurso selecionado, redirecionando para seleção');
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    
    // Verificar se o concurso ainda existe e está ativo
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', preference.concurso_id)
      .eq('is_active', true)
      .single();
    
    if (concursoError || !concurso) {
      // Concurso não existe ou não está ativo, limpar preferência e redirecionar
      await supabase
        .from('user_concurso_preferences')
        .update({ is_active: false })
        .eq('id', preference.id);
      
      console.log('Concurso não existe ou não está ativo, redirecionando para seleção');
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    
    // Verificar se a categoria do concurso ainda existe e está ativa
    const { data: categoria, error: categoriaError } = await supabase
      .from('concurso_categorias')
      .select('*')
      .eq('id', concurso.categoria_id)
      .eq('is_active', true)
      .single();
    
    if (categoriaError || !categoria) {
      // Categoria não existe ou não está ativa, limpar preferência e redirecionar
      await supabase
        .from('user_concurso_preferences')
        .update({ is_active: false })
        .eq('id', preference.id);
      
      console.log('Categoria não existe ou não está ativa, redirecionando para seleção');
      return NextResponse.redirect(new URL('/selecionar-concurso', request.url));
    }
    
    // Tudo OK, permitir acesso
    return null;
    
  } catch (error) {
    console.error('Erro no middleware de concurso:', error);
    
    // Em caso de erro, redirecionar para seleção de concurso
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
      pathname.startsWith('/apostilas') || 
      pathname.startsWith('/plano-estudos') || 
      pathname.startsWith('/configuracoes') ||
      pathname === '/' || // Proteger a página inicial
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