import type { NextRequest } from 'next/server';

/**
 * Sanitiza um token para exibição em logs (mostra apenas primeiros 4 e últimos 4 caracteres)
 * @param token Token a ser sanitizado
 * @returns Token sanitizado ou string vazia se não fornecido
 */
export function sanitizeToken(token: string | null): string {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 8) return '[REDACTED]';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

/**
 * Sanitiza um header de cookies para exibição em logs
 * @param cookieHeader String completa do header de cookies
 * @returns String sanitizada com tokens truncados
 */
function sanitizeCookieHeader(cookieHeader: string): string {
  if (!cookieHeader) return '';
  
  // Para simplificar, vamos apenas mostrar uma versão muito truncada
  // já que o header é muito longo e complexo
  if (cookieHeader.length > 100) {
    return `[COOKIE_HEADER_TRUNCATED] - ${cookieHeader.length} chars - Contains auth tokens`;
  }
  
  return cookieHeader;
}

/**
 * Sanitiza um objeto de headers para logs, mascarando valores sensíveis
 */
export function sanitizeHeadersForLog(headers: Headers | Record<string, string>): Record<string, string> {
  const entries: [string, string][] =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Object.entries(headers);

  const sanitized: Record<string, string> = {};

  for (const [rawKey, value] of entries) {
    const key = rawKey.toLowerCase();
    if (key === 'authorization') {
      if (typeof value === 'string' && value.startsWith('Bearer ')) {
        const token = value.slice(7);
        sanitized[rawKey] = `Bearer ${sanitizeToken(token)}`;
      } else {
        sanitized[rawKey] = sanitizeToken(value);
      }
    } else if (key === 'cookie' || key === 'set-cookie') {
      sanitized[rawKey] = sanitizeCookieHeader(value);
    } else if (key.includes('token') || key.includes('secret') || key.includes('key')) {
      sanitized[rawKey] = sanitizeToken(value);
    } else {
      sanitized[rawKey] = value;
    }
  }

  return sanitized;
}

/**
 * Extrai o token de autenticação do cabeçalho da requisição ou cookies
 * @param request Requisição Next.js
 * @returns Token de autenticação ou null se não encontrado
 */
export function extractAuthToken(request: Request | NextRequest): string | null {
  console.log('[DEBUG] Extraindo token de autenticação...');
  
  // Tentar obter do cabeçalho Authorization
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const tmpToken = authHeader.slice(7);
      console.log('[DEBUG] Authorization header:', `Bearer ${sanitizeToken(tmpToken)}`);
    } else {
      console.log('[DEBUG] Authorization header:', sanitizeToken(authHeader));
    }
  } else {
    console.log('[DEBUG] Authorization header:', 'null');
  }
  
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
  console.log('[DEBUG] Cookie header:', cookieHeader ? sanitizeCookieHeader(cookieHeader) : 'null');
  
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    console.log('[DEBUG] Cookies parseados:', Object.keys(cookies));
    
    if (cookies.auth_token) {
      console.log('[DEBUG] Token encontrado no cookie');
      return cookies.auth_token;
    }
  }
  
  // Tentar obter do localStorage (apenas no lado do cliente)
  if (typeof window !== 'undefined') {
    const localStorageToken = localStorage.getItem('auth_token');
    if (localStorageToken) {
      console.log('[DEBUG] Token encontrado no localStorage');
      return localStorageToken;
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