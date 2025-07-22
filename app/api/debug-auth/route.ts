import { NextRequest, NextResponse } from 'next/server';
import { extractAuthToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Extrair token usando nossa função utilitária
    const extractedToken = extractAuthToken(request);
    
    // Verificar cabeçalhos
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    // Construir resposta de debug
    const debugInfo = {
      extractedToken: extractedToken ? `${extractedToken.substring(0, 10)}...` : null,
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : null,
      hasCookieHeader: !!cookieHeader,
      cookieHeader: cookieHeader,
      allHeaders: Object.fromEntries(request.headers.entries()),
      url: request.url,
      method: request.method,
    };
    
    return NextResponse.json({
      success: true,
      message: 'Informações de autenticação',
      data: debugInfo
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao obter informações de autenticação',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}