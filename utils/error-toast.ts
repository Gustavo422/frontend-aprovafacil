import { toast } from '@/components/ui/use-toast';
import { getErrorMessageFromStatus } from './api-error-handler';

/**
 * Show an error toast notification
 * @param title Title of the error
 * @param message Error message
 */
export function showErrorToast(title: string, message: string) {
  toast({
    title,
    descricao: message,
    variant: 'destructive',
  });
}

/**
 * Show an error toast notification based on HTTP status code
 * @param statusCode HTTP status code
 * @param customMessage Optional custom message to override default
 */
export function showErrorToastFromStatus(statusCode: number, customMessage?: string) {
  const message = customMessage || getErrorMessageFromStatus(statusCode);
  
  let title = 'Erro';
  if (statusCode >= 500) {
    title = 'Erro no servidor';
  } else if (statusCode === 401 || statusCode === 403) {
    title = 'Erro de autenticação';
  } else if (statusCode >= 400) {
    title = 'Erro de requisição';
  }
  
  showErrorToast(title, message);
}

/**
 * Show an error toast for network errors
 */
export function showNetworkErrorToast() {
  showErrorToast(
    'Erro de conexão',
    'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
  );
}

/**
 * Show an error toast for unknown errors
 * @param error Error object or message
 */
export function showUnknownErrorToast(error: unknown) {
  const message = error instanceof Error 
    ? error.message 
    : 'Ocorreu um erro inesperado';
    
  showErrorToast('Erro', message);
}