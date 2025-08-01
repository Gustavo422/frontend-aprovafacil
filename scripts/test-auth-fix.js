#!/usr/bin/env node

const http = require('http');

console.log('🔧 Testando Correção de Autenticação...\n');

// Token de exemplo (substitua por um token válido se necessário)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOiIxOTljYWQ2Mi0xMTMyLTQzMTMtYjE2NS1mZTA0OWUxNzYyMzkiLCJlbWFpbCI6InNtaWxlZWxldHJvbmljc0BnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQwNTA3NDUsImV4cCI6MTc1NDA1MjI0NX0.7FYZwnM7TZHb950LEuj_MOOX-S7WQnZIA3QKU3_quFI';

// Função para fazer requisição HTTP
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: url,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Função para testar endpoint com autenticação
async function testAuthEndpoint(endpoint, token, description) {
  console.log(`🔍 Testando: ${description}`);
  
  try {
    const response = await makeRequest(endpoint, 'GET', {
      'Authorization': `Bearer ${token}`
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ ${endpoint} - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos:`, response.data);
    } else if (response.statusCode === 401) {
      console.log(`🔒 ${endpoint} - Não autenticado (401)`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    } else {
      console.log(`❌ ${endpoint} - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 ${endpoint} - Erro de conexão:`, error.message);
  }
  
  console.log('');
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de autenticação...\n');
  
  // Testar endpoint de preferências com token
  await testAuthEndpoint(
    '/api/user/concurso-preference',
    TEST_TOKEN,
    'Endpoint de preferências com token JWT'
  );
  
  // Testar endpoint de preferências sem token
  await testAuthEndpoint(
    '/api/user/concurso-preference',
    null,
    'Endpoint de preferências sem token (deve retornar 401)'
  );
  
  // Testar endpoint público para comparação
  console.log('🔍 Testando endpoint público para comparação:');
  try {
    const response = await makeRequest('/api/concursos');
    if (response.statusCode === 200) {
      console.log(`✅ /api/concursos - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} concursos`);
    } else {
      console.log(`❌ /api/concursos - Status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`💥 /api/concursos - Erro de conexão:`, error.message);
  }
  
  console.log('\n📋 Resumo dos testes:');
  console.log('• Se o endpoint com token retornar 200, a correção funcionou');
  console.log('• Se retornar 401, ainda há problemas de autenticação');
  console.log('• O endpoint sem token deve sempre retornar 401');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Se a correção funcionou, o frontend deve carregar dados corretamente');
  console.log('2. Se não funcionou, verifique:');
  console.log('   • Se o JWT_SECRET está configurado no backend');
  console.log('   • Se o token não está expirado');
  console.log('   • Se há erros no console do backend');
  
  console.log('\n🎯 Problema identificado e corrigido:');
  console.log('✅ Backend estava usando Supabase Auth em vez de JWT');
  console.log('✅ Corrigido para usar verificação JWT');
  console.log('✅ Token agora deve ser validado corretamente');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAuthEndpoint, makeRequest }; 