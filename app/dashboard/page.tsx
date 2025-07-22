'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface ApiData {
  endpoint?: string;
  status?: number;
  data?: unknown;
  [key: string]: unknown;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const router = useRouter();
  
  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se há token no localStorage
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (!storedToken) {
          // Redirecionar para login se não houver token
          router.push('/login-simples');
          return;
        }
        
        setToken(storedToken);
        
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (err) {
            console.error('Erro ao parsear dados do usuário:', err);
          }
        }
        
        // Verificar se o token é válido fazendo uma requisição ao backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/api/user/auth-test`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Token inválido ou expirado');
        }
        
        const data = await response.json();
        setApiData(data);
        
      } catch (err) {
        console.error('Erro de autenticação:', err);
        setError(err instanceof Error ? err.message : 'Erro de autenticação');
        
        // Limpar dados de autenticação
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Redirecionar para login após um breve delay
        setTimeout(() => {
          router.push('/login-simples');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Redirecionar para login
    router.push('/login-simples');
  };
  
  const testApi = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/user/concurso-preference`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      setApiData({
        endpoint: '/api/user/concurso-preference',
        status: response.status,
        data
      });
      
    } catch (err) {
      console.error('Erro ao testar API:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}
        
        {user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Dados do Usuário</h2>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Nome:</strong> {user.nome}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Função:</strong> {user.role}</p>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Token</h2>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="break-all text-sm">{token}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <button
            onClick={testApi}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Testar API de Preferências'}
          </button>
        </div>
        
        {apiData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Resposta da API</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}