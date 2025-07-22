import { NextRequest } from 'next/server';

/**
 * Extrai o token de autenticação do cabeçalho da requisição ou cookies
 * @param request Requisição Next.js
 * @returns Token de autenticação ou null se não encontrado
 */
export function extractAuthToken(request: Request | NextRequest): string | null {
  console.log('[DEBUG] Extraindo token de autenticação...');
  
  // Tentar obter do cabeçalho Authorization
  const authHeader = request.headers.get('Authorization');
  console.log('[DEBUG] Authorization header:', authHeader);
  
  if (authHeader) {
    // Formato esperado: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      console.log('[DEBUG] Token encontrado no Authorization header');
      return parts[1];
    }
  }
  
  // Tentar obter do cookie
  const cookieHeader = request.headers.get('Cookie');
  console.log('[DEBUG] Cookie header:', cookieHeader);
  
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    console.log('[DEBUG] Cookies parseados:', Object.keys(cookies));
    
    if (cookies.auth_token) {
      console.log('[DEBUG] Token encontrado no cookie');
      return cookies.auth_token;
    }
  }
  
  console.log('[DEBUG] Token não encontrado');
  return null;
}

/**
 * Analisa uma string de cookies em um objeto
 * @param cookieHeader String de cookies do cabeçalho
 * @returns Objeto com os cookies
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      // Unir o resto caso haja múltiplos sinais de igual
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });
  
  return cookies;
}