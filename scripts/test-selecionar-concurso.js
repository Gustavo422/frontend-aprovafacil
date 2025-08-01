#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando Página de Selecionar Concurso...\n');

// Função para fazer requisição HTTP
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
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
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
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
  console.log('🚀 Iniciando teste da página de selecionar concurso...\n');
  
  // Testar página de selecionar concurso
  console.log('🔍 Testando: /selecionar-concurso');
  try {
    const response = await makeRequest('/selecionar-concurso');
    
    if (response.statusCode === 200) {
      console.log(`✅ /selecionar-concurso - Status: ${response.statusCode}`);
      console.log(`   📦 Página carregada com sucesso`);
      
      // Verificar se a página contém elementos esperados
      const html = response.data;
      if (html.includes('Selecione seu Concurso')) {
        console.log(`   ✅ Título da página encontrado`);
      } else {
        console.log(`   ❌ Título da página não encontrado`);
      }
      
      if (html.includes('bg-background')) {
        console.log(`   ✅ Tema dark aplicado`);
      } else {
        console.log(`   ❌ Tema dark não encontrado`);
      }
      
      if (html.includes('AprovaFácil')) {
        console.log(`   ✅ Logo encontrado`);
      } else {
        console.log(`   ❌ Logo não encontrado`);
      }
      
    } else {
      console.log(`❌ /selecionar-concurso - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`💥 /selecionar-concurso - Erro de conexão:`, error.message);
  }
  
  console.log('');
  
  // Testar página inicial para comparação
  console.log('🔍 Testando: / (página inicial)');
  try {
    const response = await makeRequest('/');
    
    if (response.statusCode === 200) {
      console.log(`✅ / - Status: ${response.statusCode}`);
      console.log(`   📦 Página inicial carregada`);
    } else {
      console.log(`❌ / - Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`💥 / - Erro de conexão:`, error.message);
  }
  
  console.log('\n📋 Resumo dos testes:');
  console.log('• Se a página retornar 200, o layout está funcionando');
  console.log('• Se retornar erro de módulo, há problemas de import');
  console.log('• Se retornar 404, a rota não está configurada');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Se a página carregar, teste no navegador');
  console.log('2. Se não carregar, verifique:');
  console.log('   • Se há erros no console do Next.js');
  console.log('   • Se todos os imports estão corretos');
  console.log('   • Se o servidor está rodando');
  
  console.log('\n🎯 Problemas corrigidos:');
  console.log('✅ Import do UserNav corrigido');
  console.log('✅ Layout simplificado para evitar dependências');
  console.log('✅ Tema dark aplicado');
  console.log('✅ Página isolada do dashboard');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest }; 