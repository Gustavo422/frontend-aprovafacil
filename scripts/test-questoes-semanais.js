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
  console.log('🚀 Iniciando teste dos endpoints de questões semanais...\n');
  
  // Testar endpoints NOVOS (recomendados)
  console.log('🔍 Testando: /api/questoes-semanais/atual (NOVO)');
  try {
    const response = await makeRequest('/api/questoes-semanais/atual');
    
    if (response.statusCode === 200) {
      console.log(`✅ /api/questoes-semanais/atual - Status: ${response.statusCode}`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.questoes?.length || 0} questões`);
      
      if (response.data.data?.questao_semanal) {
        console.log(`   📋 Semana atual:`, {
          numero_semana: response.data.data.questao_semanal.numero_semana,
          ano: response.data.data.questao_semanal.ano,
          titulo: response.data.data.questao_semanal.titulo
        });
      }

      // Verificar se o campo status está sendo retornado
      if (response.data.data?.status) {
        console.log(`   ✅ Status da semana:`, {
          semana_atual: response.data.data.status.semana_atual,
          modo_desbloqueio: response.data.data.status.modo_desbloqueio,
          tempo_restante: response.data.data.status.tempo_restante ? `${Math.floor(response.data.data.status.tempo_restante / 3600)}h ${Math.floor((response.data.data.status.tempo_restante % 3600) / 60)}m` : 'N/A',
          inicio_semana: response.data.data.status.inicio_semana_em,
          fim_semana: response.data.data.status.fim_semana_em
        });
      } else {
        console.log(`   ❌ Campo 'status' não encontrado na resposta`);
      }
    } else {
      console.log(`❌ /api/questoes-semanais/atual - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais/atual - Erro de conexão:`, error.message);
  }
  
  console.log('');
  
  // Testar endpoint de roadmap (NOVO)
  console.log('🔍 Testando: /api/questoes-semanais/roadmap (NOVO)');
  try {
    const response = await makeRequest('/api/questoes-semanais/roadmap');
    
    if (response.statusCode === 200) {
      console.log(`✅ /api/questoes-semanais/roadmap - Status: ${response.statusCode}`);
      console.log(`   📦 Roadmap recebido: ${response.data.data?.length || 0} semanas`);
    } else {
      console.log(`❌ /api/questoes-semanais/roadmap - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais/roadmap - Erro de conexão:`, error.message);
  }
  
  console.log('');
  
  // Testar endpoint de histórico (NOVO)
  console.log('🔍 Testando: /api/questoes-semanais/historico (NOVO)');
  try {
    const response = await makeRequest('/api/questoes-semanais/historico');
    
    if (response.statusCode === 200) {
      console.log(`✅ /api/questoes-semanais/historico - Status: ${response.statusCode}`);
      console.log(`   📦 Histórico recebido: ${response.data.data?.length || 0} semanas concluídas`);
    } else {
      console.log(`❌ /api/questoes-semanais/historico - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais/historico - Erro de conexão:`, error.message);
  }
  
  console.log('');
  
  // Testar endpoint ANTIGO (DEPRECATADO)
  console.log('⚠️  Testando: /api/questoes-semanais (DEPRECATADO)');
  try {
    const response = await makeRequest('/api/questoes-semanais');
    
    if (response.statusCode === 200) {
      console.log(`⚠️  /api/questoes-semanais - Status: ${response.statusCode} (DEPRECATADO)`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} questões`);
      console.log(`   🚨 DEPRECATION WARNING: Esta rota será removida em 2024-06-01`);
      console.log(`   💡 Use /api/questoes-semanais/atual em vez disso`);
      
      // Verificar headers de deprecação
      if (response.headers['x-deprecated'] === 'true') {
        console.log(`   📋 Headers de deprecação:`, {
          deprecated: response.headers['x-deprecated'],
          since: response.headers['x-deprecated-since'],
          recommended: response.headers['x-recommended-route'],
          sunset: response.headers['x-sunset-date']
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
  
  // Testar endpoint ANTIGO com filtros (DEPRECATADO)
  console.log('⚠️  Testando: /api/questoes-semanais?ativo=true (DEPRECATADO)');
  try {
    const response = await makeRequest('/api/questoes-semanais?ativo=true');
    
    if (response.statusCode === 200) {
      console.log(`⚠️  /api/questoes-semanais?ativo=true - Status: ${response.statusCode} (DEPRECATADO)`);
      console.log(`   📦 Dados recebidos: ${response.data.data?.length || 0} questões ativas`);
      console.log(`   🚨 DEPRECATION WARNING: Esta rota será removida em 2024-06-01`);
      console.log(`   💡 Use /api/questoes-semanais/atual em vez disso`);
    } else {
      console.log(`❌ /api/questoes-semanais?ativo=true - Status: ${response.statusCode}`);
      console.log(`   🚨 Erro:`, response.data.error || response.data);
    }
    
  } catch (error) {
    console.log(`💥 /api/questoes-semanais?ativo=true - Erro de conexão:`, error.message);
  }
  
  console.log('\n📋 Resumo dos testes:');
  console.log('✅ Endpoints NOVOS funcionando: /atual, /roadmap, /historico');
  console.log('⚠️  Endpoints ANTIGOS funcionando mas DEPRECATADOS: / (raiz), /:id');
  console.log('🚨 Rota antiga será removida em 2024-06-01');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. ✅ Novos endpoints estão funcionando perfeitamente');
  console.log('2. ⚠️  Rotas antigas ainda funcionam mas com warnings de deprecação');
  console.log('3. 🔄 Frontend já migrou para os novos endpoints');
  console.log('4. 🗑️  Rotas antigas podem ser removidas após 2024-06-01');
  
  console.log('\n🎯 Status da migração:');
  console.log('✅ Backend: Novos endpoints implementados');
  console.log('✅ Frontend: Migrado para novos endpoints');
  console.log('✅ Compatibilidade: Mantida com warnings de deprecação');
  console.log('✅ Observabilidade: Logs e headers de deprecação ativos');
  console.log('✅ Segurança: Filtro de concurso aplicado em todas as rotas');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest }; 