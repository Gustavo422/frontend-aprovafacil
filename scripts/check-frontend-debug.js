#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Sistema de Debug do Frontend...\n');

// Verificar arquivos de debug
const debugFiles = [
  'src/lib/debug-interceptor.ts',
  'src/lib/api.tsx',
  'scripts/start-debug.js'
];

console.log('📁 Verificando arquivos de debug:');
for (const file of debugFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - Não encontrado`);
  }
}

// Verificar variáveis de ambiente
console.log('\n🌍 Verificando variáveis de ambiente:');
const envVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_DEBUG',
  'NEXT_PUBLIC_API_URL'
];

for (const envVar of envVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar} = ${value}`);
  } else {
    console.log(`⚠️ ${envVar} = não definida`);
  }
}

// Verificar arquivo .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
console.log('\n📝 Verificando arquivo .env.local:');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local existe');
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`   📋 ${lines.length} variáveis definidas`);
  
  for (const line of lines) {
    const [key] = line.split('=');
    console.log(`   • ${key}`);
  }
} else {
  console.log('❌ .env.local não existe');
  console.log('💡 Execute: npm run test:auth para criar automaticamente');
}

// Verificar configuração do Next.js
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
console.log('\n⚙️ Verificando configuração do Next.js:');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ next.config.js existe');
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  if (content.includes('NEXT_PUBLIC_DEBUG')) {
    console.log('✅ Configuração de debug encontrada');
  } else {
    console.log('⚠️ Configuração de debug não encontrada');
  }
} else {
  console.log('❌ next.config.js não existe');
}

// Verificar se o interceptor está sendo importado
const apiPath = path.join(__dirname, '..', 'src/lib/api.tsx');
console.log('\n🔧 Verificando importação do interceptor:');
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  if (content.includes('setupDebugInterceptors')) {
    console.log('✅ Interceptor de debug está sendo importado');
  } else {
    console.log('❌ Interceptor de debug não está sendo importado');
  }
} else {
  console.log('❌ Arquivo api.tsx não encontrado');
}

// Instruções
console.log('\n📋 Instruções para ativar debug:');
console.log('1. Execute: npm run dev:debug');
console.log('2. Abra: http://localhost:3000?debug=true');
console.log('3. Pressione F12 para abrir o console');
console.log('4. Procure por logs com prefixo [DEBUG]');
console.log('5. Se não aparecer logs, verifique:');
console.log('   • Se NEXT_PUBLIC_DEBUG=true está definido');
console.log('   • Se o interceptor está sendo carregado');
console.log('   • Se há erros no console do navegador');

// Verificar se há erros comuns
console.log('\n🔍 Verificando problemas comuns:');
const commonIssues = [
  {
    name: 'Interceptor não carregado',
    check: () => {
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      return apiContent.includes('setupDebugInterceptors') && 
             apiContent.includes('NEXT_PUBLIC_DEBUG');
    }
  },
  {
    name: 'Variáveis de ambiente não definidas',
    check: () => {
      return process.env.NEXT_PUBLIC_DEBUG === 'true';
    }
  },
  {
    name: 'Arquivo .env.local não existe',
    check: () => {
      return fs.existsSync(envLocalPath);
    }
  }
];

for (const issue of commonIssues) {
  if (issue.check()) {
    console.log(`✅ ${issue.name} - OK`);
  } else {
    console.log(`❌ ${issue.name} - Problema detectado`);
  }
}

console.log('\n🎯 Resumo:');
console.log('• Se todos os arquivos existem e as variáveis estão definidas,');
console.log('  o sistema de debug deve funcionar corretamente.');
console.log('• Execute os testes para verificar se os endpoints estão funcionando.');
console.log('• Verifique os logs do backend para erros de banco de dados.'); 