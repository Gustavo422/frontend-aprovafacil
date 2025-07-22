/**
 * Utilitários para gerenciar cookies no lado do cliente
 */

/**
 * Obtém um cookie pelo nome
 * @param name Nome do cookie
 * @returns Valor do cookie ou null se não encontrado
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const value = document.cookie.split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
    
  return value ? decodeURIComponent(value) : null;
}

/**
 * Define um cookie
 * @param name Nome do cookie
 * @param value Valor do cookie
 * @param options Opções do cookie
 */
export function setCookie(
  name: string, 
  value: string, 
  options: { 
    expires?: Date | number; 
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void {
  if (typeof window === 'undefined') return;
  
  let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (options.expires) {
    if (typeof options.expires === 'number') {
      const days = options.expires;
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      cookieStr += `; expires=${date.toUTCString()}`;
    } else {
      cookieStr += `; expires=${options.expires.toUTCString()}`;
    }
  }
  
  if (options.path) cookieStr += `; path=${options.path}`;
  if (options.secure) cookieStr += '; secure';
  if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
  
  document.cookie = cookieStr;
}

/**
 * Remove um cookie
 * @param name Nome do cookie
 * @param path Caminho do cookie
 */
export function removeCookie(name: string, path = '/'): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}