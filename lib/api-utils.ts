import { NextResponse } from 'next/server';

/**
 * Utilitário para verificar a configuração do backend e criar URLs para as requisições
 * @param path Caminho da API no backend
 * @param searchParams Parâmetros de busca opcionais
 * @returns Objeto com URL do backend e status de validação
 */
export function getBackendUrl(path: string, searchParams?: string) {
  if (!process.env.BACKEND_API_URL) {
    console.error('BACKEND_API_URL is not defined');
    return { 
      isValid: false, 
      url: '', 
      error: NextResponse.json(
        { error: 'Configuração do servidor incompleta' }, 
        { status: 500 }
      )
    };
  }
  
  const url = `${process.env.BACKEND_API_URL}${path}${searchParams || ''}`;
  console.log(`API Request to: ${url}`);
  
  return { isValid: true, url, error: null };
}

/**
 * Wrapper para tratamento de erros em rotas de API
 * @param handler Função que processa a requisição
 * @returns Resposta da API ou erro tratado
 */
export async function withErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}