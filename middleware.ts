import { NextRequest, NextResponse } from 'next/server';
import { verificarConcursoSelecionado } from './middleware/concurso-guard';

/**
 * Apply Content Security Policy headers
 * @param response Next.js response
 */
function applySecurityHeaders(response: NextResponse): void {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.vercel.app; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'self'; " +
    "upgrade-insecure-requests;"
  );
  
  // Other security headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rotas /admin e subrotas
  if (pathname.startsWith('/admin')) {
    // Checar se existe token de autenticação no cookie ou no cabeçalho
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    // Priorizar o token do cabeçalho, se disponível
    const token = authHeader ? authHeader.replace('Bearer ', '') : cookieToken;
    
    if (!token) {
      // Redirecionar para login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      applySecurityHeaders(response);
      return response;
    }

    // Validar token e verificar se é admin
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const loginUrl = new URL('/login', request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        applySecurityHeaders(redirectResponse);
        return redirectResponse;
      }

      const data = await response.json();
      
      // Verificar se o usuário tem role de admin
      if (!data.success || !data.data || data.data.role !== 'admin') {
        const unauthorizedUrl = new URL('/login?error=unauthorized', request.url);
        const redirectResponse = NextResponse.redirect(unauthorizedUrl);
        applySecurityHeaders(redirectResponse);
        return redirectResponse;
      }
    } catch (error) {
      console.error('Erro ao validar token no middleware:', error);
      const loginUrl = new URL('/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  // Verificar se é uma rota que precisa de verificação de concurso
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
      pathname.startsWith('/configuracoes')) {
    
    const concursoCheck = await verificarConcursoSelecionado(request);
    if (concursoCheck) {
      applySecurityHeaders(concursoCheck);
      return concursoCheck;
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};



