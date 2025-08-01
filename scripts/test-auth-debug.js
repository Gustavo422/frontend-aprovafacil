#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testando Sistema de Debug e Autenticação do Frontend...\n');

// Verificar se o arquivo .env.local existe
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env.local...');
  const envContent = `# Configurações de Debug
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Configurações do Supabase (se necessário)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.local criado');
}

// Verificar se o backend está rodando
function checkBackend() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend está rodando na porta 5000');
        resolve(true);
      } else {
        console.log('⚠️ Backend respondeu com status:', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log('❌ Backend não está rodando na porta 5000');
      console.log('💡 Execute: cd backend && npm run dev:debug');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout ao conectar com o backend');
      resolve(false);
    });

    req.end();
  });
}

// Testar token de autenticação
function testAuthToken() {
  console.log('\n🔐 Testando token de autenticação...');
  
  const token = process.env.AUTH_TOKEN || 'test_token';
  
  const http = require('http');
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.token) {
          console.log('✅ Login de teste bem-sucedido');
          console.log('🔑 Token obtido:', response.token.substring(0, 20) + '...');
          
          // Testar endpoint protegido
          testProtectedEndpoint(response.token);
        } else {
          console.log('❌ Login falhou:', response.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.log('❌ Erro ao processar resposta:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erro na requisição de login:', error.message);
  });

  req.write(postData);
  req.end();
}

// Testar endpoint protegido
function testProtectedEndpoint(token) {
  console.log('\n🛡️ Testando endpoint protegido...');
  
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/concurso-preference',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ Endpoint protegido acessível');
        try {
          const response = JSON.parse(data);
          console.log('📦 Dados recebidos:', response);
        } catch (error) {
          console.log('📦 Resposta (texto):', data);
        }
      } else if (res.statusCode === 401) {
        console.log('❌ Token inválido ou expirado');
        console.log('📦 Resposta:', data);
      } else {
        console.log('⚠️ Status inesperado:', res.statusCode);
        console.log('📦 Resposta:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erro na requisição:', error.message);
  });

  req.end();
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de debug e autenticação...\n');
  
  // Verificar backend
  const backendRunning = await checkBackend();
  
  if (!backendRunning) {
    console.log('\n💡 Para executar os testes completos:');
    console.log('   1. Inicie o backend: cd backend && npm run dev:debug');
    console.log('   2. Execute este script novamente');
    return;
  }
  
  // Testar autenticação
  testAuthToken();
  
  console.log('\n📋 Próximos passos:');
  console.log('   1. Abra http://localhost:3000?debug=true');
  console.log('   2. Pressione F12 para abrir o console');
  console.log('   3. Procure por logs com prefixo [DEBUG]');
  console.log('   4. Verifique se as requisições estão sendo logadas');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkBackend, testAuthToken }; 