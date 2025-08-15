#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Iniciando AprovaFácil Frontend em modo DEBUG...\n');

// Configurar variáveis de ambiente para debug
process.env.NODE_ENV = 'development';
process.env.NEXT_PUBLIC_DEBUG = 'true';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api';

console.log('📊 Sistema de Debug Ativado:');
console.log('  • Logs de requisições HTTP');
console.log('  • Logs de respostas do backend');
console.log('  • Logs de erros de rede');
console.log('  • Logs de parsing de dados');
console.log('  • Logs de autenticação');
console.log('  • API URL: http://localhost:5000/api\n');

// Limpeza preventiva do cache do Next/Turbopack (evita ENOENT em Windows)
try {
  const projectRoot = process.cwd();
  const nextDir = path.join(projectRoot, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('🧹 Cache do Next (.next) limpo com sucesso.');
  }
} catch (e) {
  console.warn('⚠️  Não foi possível limpar o cache do Next automaticamente:', e?.message);
}

// Função para executar comando
function runCommand(command, args, name) {
  console.log(`🔄 Iniciando ${name}...`);
  
  const fullCommand = `${command} ${args.join(' ')}`;
  
  const child = exec(fullCommand, {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_DEBUG: 'true',
      NEXT_PUBLIC_API_URL: 'http://localhost:5000/api',
      TURBOPACK: '0',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Erro ao executar ${name}:`, error.message);
      process.exit(1);
    }
  });

  if (child.stdout) {
    child.stdout.pipe(process.stdout);
  }
  if (child.stderr) {
    child.stderr.pipe(process.stderr);
  }

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} encerrou com código ${code}`);
      process.exit(code || 1);
    }
  });

  return child;
}

// Iniciar frontend
// Forçar execução sem Turbopack para evitar erros ENOENT de manifest no Windows
const frontendProcess = runCommand('npm', ['run', 'dev:no-turbo'], 'Frontend');

// Gerenciar encerramento
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando frontend...');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando frontend...');
  frontendProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n📋 Comandos úteis:');
console.log('  • Ctrl+C: Encerrar aplicação');
console.log('  • Frontend: http://localhost:3000');
console.log('  • Debug URL: http://localhost:3000?debug=true');
console.log('  • Console do navegador: F12 > Console');
console.log('  • Backend API: http://localhost:5000/api\n');

console.log('🔍 Logs de Debug serão exibidos no console do navegador');
console.log('💡 Para ver logs detalhados:');
console.log('   1. Abra http://localhost:3000?debug=true');
console.log('   2. Pressione F12 para abrir o console');
console.log('   3. Procure por logs com prefixo [DEBUG]\n'); 