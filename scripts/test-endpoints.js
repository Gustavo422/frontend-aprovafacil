#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando Endpoints Corrigidos...\n');

// Configurações
const BASE_URL = 'http://localhost:5000';
const ENDPOINTS = [
  '/api/concursos',
  '/api/concurso-categorias',
  '/api/health'
];

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

// Função para testar endpoint
async function testEndpoint(endpoint) {
  console.log(`🔍 Testando: ${endpoint}`);
  
  try {
    const response = await makeRequest(endpoint);
    
    if (response.statusCode === 200) {
      console.log(`✅ ${endpoint} - Status: ${response.statusCode}`);
      
      if (response.data.success) {
        console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} registros`);
        
        if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          console.log(`   📋 Primeiro registro:`, {
            id: response.data.data[0].id,
            nome: response.data.data[0].nome,
            tipo: typeof response.data.data[0]
          });
        }
      } else {
        console.log(`   ⚠️ Resposta sem sucesso:`, response.data.error);
      }
    } else {
      console.log(`❌ ${endpoint} - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 ${endpoint} - Erro de conexão:`, error.message);
  }
  
  console.log('');
}

// Função para testar endpoint com autenticação
async function testAuthEndpoint(endpoint, token) {
  console.log(`🔐 Testando endpoint autenticado: ${endpoint}`);
  
  try {
    const response = await makeRequest(endpoint, 'GET', {
      'Authorization': `Bearer ${token}`
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ ${endpoint} - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos:`, response.data);
    } else if (response.statusCode === 401) {
      console.log(`🔒 ${endpoint} - Não autenticado (esperado se não há token válido)`);
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
  console.log('🚀 Iniciando testes dos endpoints...\n');
  
  // Testar endpoints públicos
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  // Testar endpoint autenticado (sem token válido)
  await testAuthEndpoint('/api/user/concurso-preference', 'invalid_token');
  
  console.log('📋 Resumo dos testes:');
  console.log('   • Endpoints públicos devem retornar 200');
  console.log('   • Endpoint autenticado deve retornar 401 sem token válido');
  console.log('   • Verifique os logs do backend para mais detalhes\n');
  
  console.log('💡 Próximos passos:');
  console.log('   1. Se os endpoints públicos funcionam, o problema era a tabela incorreta');
  console.log('   2. Para testar autenticação, faça login no frontend');
  console.log('   3. Verifique se o token está sendo enviado corretamente');
  console.log('   4. Execute o frontend com debug: npm run dev:debug');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, testAuthEndpoint, makeRequest }; 