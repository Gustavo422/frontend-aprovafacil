#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando Endpoint de Questões Semanais...\n');

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

// Função principal
async function main() {
  console.log('🚀 Iniciando teste do endpoint de questões semanais...\n');
  
  // Testar endpoint de questões semanais
  console.log('🔍 Testando: /api/questoes-semanais');
  try {
    const response = await makeRequest('/api/questoes-semanais');
    
    if (response.statusCode === 200) {
      console.log(`✅ /api/questoes-semanais - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} questões`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`   📋 Primeira questão:`, {
          id: response.data.data[0].id,
          titulo: response.data.data[0].titulo,
          numero_semana: response.data.data[0].numero_semana,
          ano: response.data.data[0].ano
        });
      }
    } else {
      console.log(`❌ /api/questoes-semanais - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais - Erro de conexão:`, error.message);
  }
  
  console.log('');
  
  // Testar endpoint com filtros
  console.log('🔍 Testando: /api/questoes-semanais?ativo=true');
  try {
    const response = await makeRequest('/api/questoes-semanais?ativo=true');
    
    if (response.statusCode === 200) {
      console.log(`✅ /api/questoes-semanais?ativo=true - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} questões ativas`);
    } else {
      console.log(`❌ /api/questoes-semanais?ativo=true - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais?ativo=true - Erro de conexão:`, error.message);
  }
  
  console.log('\n📋 Resumo dos testes:');
  console.log('• Se o endpoint retornar 200, a correção funcionou');
  console.log('• Se retornar 500, ainda há problemas no backend');
  console.log('• Se retornar 404, a rota não está registrada');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Se a correção funcionou, o frontend deve carregar questões semanais');
  console.log('2. Se não funcionou, verifique:');
  console.log('   • Se a tabela questoes_semanais existe no banco');
  console.log('   • Se há dados na tabela');
  console.log('   • Se há erros no console do backend');
  
  console.log('\n🎯 Problema identificado e corrigido:');
  console.log('✅ Endpoint estava tentando acessar tabela disciplinas_categoria inexistente');
  console.log('✅ Corrigido para usar apenas concursos');
  console.log('✅ Removidas referências desnecessárias');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest }; 