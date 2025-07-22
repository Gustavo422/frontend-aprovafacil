/**
 * Utilitário para fazer requisições autenticadas
 */

/**
 * Faz uma requisição autenticada para o backend
 * @param url URL da requisição
 * @param options Opções da requisição
 * @returns Resposta da requisição
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Obter token do localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // Adicionar token ao cabeçalho Authorization
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Fazer requisição
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Faz uma requisição GET autenticada
 * @param url URL da requisição
 * @param options Opções da requisição
 * @returns Resposta da requisição
 */
export async function getWithAuth<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Faz uma requisição POST autenticada
 * @param url URL da requisição
 * @param data Dados a serem enviados
 * @param options Opções da requisição
 * @returns Resposta da requisição
 */
export async function postWithAuth<T = unknown>(url: string, data: unknown, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return response.json();
}