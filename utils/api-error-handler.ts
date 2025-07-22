/**
 * Utility functions for handling API errors consistently across the application
 */

/**
 * Process API response and handle errors
 * @param response Fetch API Response object
 * @returns Object with success status, data, error message, and status code
 */
export async function handleApiResponse<T>(response: Response): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}> {
  const status = response.status;
  
  try {
    // Try to parse the response as JSON
    const data = await response.json();
    
    if (!response.ok) {
      // If response has error message, use it
      const errorMessage = data.message || getErrorMessageFromStatus(status);
      return {
        success: false,
        error: errorMessage,
        status
      };
    }
    
    return {
      success: true,
      data: data as T,
      status
    };
  } catch {
    // If JSON parsing fails, return a generic error
    return {
      success: false,
      error: getErrorMessageFromStatus(status),
      status
    };
  }
}

/**
 * Get appropriate error message based on HTTP status code
 */
export function getErrorMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Requisição inválida. Verifique os dados enviados.';
    case 401:
      return 'Você não está autenticado. Faça login para continuar.';
    case 403:
      return 'Você não tem permissão para acessar este recurso.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 422:
      return 'Os dados fornecidos são inválidos. Verifique e tente novamente.';
    case 500:
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    case 503:
      return 'Serviço indisponível. Tente novamente mais tarde.';
    default:
      return 'Ocorreu um erro inesperado';
  }
}

/**
 * Determine if an error is an authentication error
 */
export function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Determine if an error is a server error
 */
export function isServerError(status: number): boolean {
  return status >= 500;
}

/**
 * Determine if an error is a client error
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}