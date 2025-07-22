'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface DebugInfo {
  [key: string]: unknown;
}

export default function AuthTestPage() {
  const { user, isAuthenticated, signIn, signOut, getToken } = useAuth();
  const token = getToken();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Função para fazer login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, senha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para fazer logout
  const handleLogout = () => {
    signOut();
  };
  
  // Função para obter informações de debug
  const fetchDebugInfo = async () => {
    try {
      // Adicionar token ao cabeçalho se disponível
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/debug-auth', {
        headers
      });
      
      const data = await response.json();
      setDebugInfo(data.data);
    } catch (err) {
      console.error('Erro ao obter informações de debug:', err);
    }
  };
  
  // Função para testar API autenticada
  const testAuthenticatedApi = async () => {
    try {
      setLoading(true);
      
      // Adicionar token ao cabeçalho se disponível
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/user/concurso-preference', {
        headers
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('API autenticada funcionou! Status: ' + response.status);
        console.log('Resposta da API:', data);
      } else {
        alert('Erro na API autenticada: ' + (data.error || response.statusText));
      }
    } catch (err) {
      alert('Erro ao testar API: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito para verificar localStorage e cookies
  useEffect(() => {
    const localStorageToken = localStorage.getItem('auth_token');
    const localStorageUser = localStorage.getItem('auth_user');
    
    console.log('Token no localStorage:', localStorageToken ? `${localStorageToken.substring(0, 10)}...` : null);
    console.log('Usuário no localStorage:', localStorageUser ? 'Presente' : null);
    
    // Verificar cookies
    const allCookies = document.cookie;
    console.log('Todos os cookies:', allCookies);
  }, [isAuthenticated]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Status de Autenticação</h2>
        <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sim' : 'Não'}</p>
        <p><strong>Token:</strong> {token ? `${token.substring(0, 10)}...` : 'Nenhum'}</p>
        <p><strong>Usuário:</strong> {user ? user.nome : 'Nenhum'}</p>
      </div>
      
      {!isAuthenticated ? (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Senha:</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={fetchDebugInfo}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Obter Informações de Debug
        </button>
        
        <button
          onClick={testAuthenticatedApi}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Testar API Autenticada
        </button>
      </div>
      
      {debugInfo && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Informações de Debug</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}