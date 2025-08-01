#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando Carregamento de Dados no Frontend...\n');

// Configurações
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

// Função para verificar se o frontend está rodando
function checkFrontend() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Função para verificar se o backend está rodando
function checkBackend() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/concursos',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de carregamento de dados...\n');

  // Verificar se o backend está rodando
  console.log('🔍 Verificando backend...');
  try {
    const backendResponse = await checkBackend();
    if (backendResponse.statusCode === 200) {
      console.log('✅ Backend está rodando e respondendo');
      if (backendResponse.data.success) {
        console.log(`   📦 Dados disponíveis: ${backendResponse.data.data?.length || 0} concursos`);
      }
    } else {
      console.log(`⚠️ Backend respondeu com status: ${backendResponse.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Backend não está rodando ou não respondeu');
    console.log('   💡 Execute: cd ../backend && npm run dev');
  }

  console.log('');

  // Verificar se o frontend está rodando
  console.log('🔍 Verificando frontend...');
  try {
    const frontendResponse = await checkFrontend();
    if (frontendResponse.statusCode === 200) {
      console.log('✅ Frontend está rodando');
      console.log('   🌐 URL: http://localhost:3000');
    } else {
      console.log(`⚠️ Frontend respondeu com status: ${frontendResponse.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Frontend não está rodando ou não respondeu');
    console.log('   💡 Execute: npm run dev:debug');
  }

  console.log('');

  // Instruções para testar
  console.log('📋 Instruções para testar o carregamento de dados:');
  console.log('1. Certifique-se de que ambos estão rodando:');
  console.log('   • Backend: http://localhost:5000');
  console.log('   • Frontend: http://localhost:3000');
  console.log('');
  console.log('2. Abra o navegador em: http://localhost:3000?debug=true');
  console.log('3. Pressione F12 para abrir o console');
  console.log('4. Procure por logs com prefixo [DEBUG]');
  console.log('5. Verifique se aparecem logs de:');
  console.log('   • Requisições para /api/concursos');
  console.log('   • Respostas com dados dos concursos');
  console.log('   • Erros de rede ou autenticação');
  console.log('');
  console.log('6. Se não aparecer dados, verifique:');
  console.log('   • Se o backend está retornando 200 para /api/concursos');
  console.log('   • Se o frontend está fazendo as requisições corretas');
  console.log('   • Se há erros de CORS ou autenticação');
  console.log('   • Se as variáveis de ambiente estão configuradas');

  console.log('\n🎯 Resumo dos problemas resolvidos:');
  console.log('✅ Endpoint /api/concursos corrigido (tabela concurso_categorias → categorias_concursos)');
  console.log('✅ Endpoint /api/user/concurso-preference corrigido (tabela user_concurso_preferences → preferencias_usuario_concurso)');
  console.log('✅ Sistema de debug configurado');
  console.log('✅ Variáveis de ambiente configuradas');
  console.log('✅ Scripts de teste criados');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkFrontend, checkBackend }; 