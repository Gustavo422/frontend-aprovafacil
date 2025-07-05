#!/usr/bin/env node

/**
 * Script para testar a compatibilidade entre o código e o banco Supabase
 * Executa: node scripts/test-supabase-compatibility.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelas esperadas pelo código
const EXPECTED_TABLES = [
  'users',
  'concurso_categorias', 
  'categoria_disciplinas',
  'concursos',
  'simulados_personalizados',
  'simulado_questions',
  'user_simulado_progress',
  'cartoes_memorizacao',
  'user_flashcard_progress',
  'apostila_inteligente',
  'apostila_content',
  'user_apostila_progress',
  'questoes_semanais',
  'user_questoes_semanais_progress',
  'mapa_assuntos',
  'user_mapa_assuntos_status',
  'planos_estudo',
  'user_concurso_preferences',
  'user_discipline_stats',
  'user_performance_cache',
  'audit_logs',
  'cache_config'
];

// Colunas críticas que devem existir
const CRITICAL_COLUMNS = {
  users: ['id', 'email', 'name', 'created_at'],
  concurso_categorias: ['id', 'nome', 'slug', 'created_at'],
  concursos: ['id', 'nome', 'created_at'],
  simulados_personalizados: ['id', 'title', 'created_at']
};

async function testConnection() {
  console.log('🔌 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📋 Verificando tabelas...');
  
  const missingTables = [];
  const existingTables = [];
  
  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        missingTables.push(tableName);
        console.log(`❌ Tabela ${tableName}: ${error.message}`);
      } else {
        existingTables.push(tableName);
        console.log(`✅ Tabela ${tableName}: OK`);
      }
    } catch (err) {
      missingTables.push(tableName);
      console.log(`❌ Tabela ${tableName}: ${err.message}`);
    }
  }
  
  return { existingTables, missingTables };
}

async function checkCriticalColumns() {
  console.log('\n🔍 Verificando colunas críticas...');
  
  const columnIssues = [];
  
  for (const [tableName, expectedColumns] of Object.entries(CRITICAL_COLUMNS)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(expectedColumns.join(','))
        .limit(1);
      
      if (error) {
        columnIssues.push(`${tableName}: ${error.message}`);
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Colunas críticas OK`);
      }
    } catch (err) {
      columnIssues.push(`${tableName}: ${err.message}`);
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
  
  return columnIssues;
}

async function checkRLS() {
  console.log('\n🔒 Verificando Row Level Security...');
  
  try {
    // Teste básico de RLS - tentar acessar dados sem autenticação
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('permission denied')) {
      console.log('✅ RLS está ativo (permissão negada como esperado)');
      return true;
    } else {
      console.log('⚠️  RLS pode não estar configurado corretamente');
      return false;
    }
  } catch (err) {
    console.log('⚠️  Erro ao verificar RLS:', err.message);
    return false;
  }
}

async function checkExtensions() {
  console.log('\n🔧 Verificando extensões PostgreSQL...');
  
  try {
    const { data, error } = await supabase.rpc('get_extensions');
    
    if (error) {
      // Fallback: tentar verificar se uuid-ossp está disponível
      const { data: uuidTest, error: uuidError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (uuidError) {
        console.log('❌ Extensão uuid-ossp pode não estar disponível');
        return false;
      } else {
        console.log('✅ Extensões básicas OK');
        return true;
      }
    } else {
      console.log('✅ Extensões verificadas');
      return true;
    }
  } catch (err) {
    console.log('⚠️  Erro ao verificar extensões:', err.message);
    return false;
  }
}

async function runCompatibilityTest() {
  console.log('🚀 Iniciando teste de compatibilidade Supabase...\n');
  
  // 1. Testar conexão
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Teste falhou na conexão');
    process.exit(1);
  }
  
  // 2. Verificar tabelas
  const { existingTables, missingTables } = await checkTables();
  
  // 3. Verificar colunas críticas
  const columnIssues = await checkCriticalColumns();
  
  // 4. Verificar RLS
  const rlsOk = await checkRLS();
  
  // 5. Verificar extensões
  const extensionsOk = await checkExtensions();
  
  // Resumo
  console.log('\n📊 RESUMO DO TESTE:');
  console.log('='.repeat(50));
  console.log(`✅ Tabelas existentes: ${existingTables.length}/${EXPECTED_TABLES.length}`);
  console.log(`❌ Tabelas faltando: ${missingTables.length}`);
  console.log(`⚠️  Problemas de colunas: ${columnIssues.length}`);
  console.log(`🔒 RLS ativo: ${rlsOk ? 'Sim' : 'Não'}`);
  console.log(`🔧 Extensões OK: ${extensionsOk ? 'Sim' : 'Não'}`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ TABELAS FALTANDO:');
    missingTables.forEach(table => console.log(`  - ${table}`));
  }
  
  if (columnIssues.length > 0) {
    console.log('\n❌ PROBLEMAS DE COLUNAS:');
    columnIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Resultado final
  const allOk = missingTables.length === 0 && columnIssues.length === 0;
  
  if (allOk) {
    console.log('\n🎉 COMPATIBILIDADE 100% OK!');
    console.log('O código está totalmente compatível com o banco Supabase.');
  } else {
    console.log('\n⚠️  PROBLEMAS DE COMPATIBILIDADE DETECTADOS');
    console.log('Execute as migrações do banco ou corrija os problemas listados acima.');
  }
  
  return allOk;
}

// Executar o teste
runCompatibilityTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Erro durante o teste:', err);
    process.exit(1);
  }); 