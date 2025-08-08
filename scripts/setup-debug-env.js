#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando Variáveis de Ambiente para Debug...\n');

// Caminho para o arquivo .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Conteúdo do arquivo .env.local
const envContent = `# Configurações de Debug do Frontend
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Configurações do Supabase (substitua pelos seus valores reais)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Configurações de Segurança
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
SESSION_TIMEOUT_MINUTES=60
PASSWORD_MIN_LENGTH=8
REQUIRE_STRONG_PASSWORD=true
ALLOW_MULTIPLE_SESSIONS=true

# Configurações de Autenticação
JWT_SECRET=8010902753635503e0e33dc19efeba3b
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Configurações de Segurança Avançada
ENABLE_2FA=false
ENABLE_DEVICE_TRUSTING=false
ENABLE_SUSPICIOUS_DETECTION=false
ENABLE_EMAIL_NOTIFICATIONS=false

# Configurações do Backend
BACKEND_API_URL=http://localhost:5000/api

# Ambiente
NODE_ENV=development
`;

try {
  // Verificar se o arquivo já existe
  if (fs.existsSync(envLocalPath)) {
    console.log('📝 Arquivo .env.local já existe');
    
    // Ler o conteúdo atual
    const currentContent = fs.readFileSync(envLocalPath, 'utf8');
    
    // Verificar se já tem as variáveis de debug
    if (currentContent.includes('NEXT_PUBLIC_DEBUG=true')) {
      console.log('✅ Variáveis de debug já estão configuradas');
    } else {
      console.log('⚠️ Adicionando variáveis de debug ao arquivo existente...');
      
      // Adicionar as variáveis de debug no início
      const updatedContent = `# Configurações de Debug do Frontend
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_API_URL=http://localhost:5000/api

${currentContent}`;
      
      fs.writeFileSync(envLocalPath, updatedContent);
      console.log('✅ Variáveis de debug adicionadas ao .env.local existente');
    }
  } else {
    console.log('📝 Criando arquivo .env.local...');
    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Arquivo .env.local criado com sucesso');
  }
  
  console.log('\n📋 Variáveis configuradas:');
  console.log('   • NEXT_PUBLIC_DEBUG=true');
  console.log('   • NEXT_PUBLIC_API_URL=http://localhost:5000/api');
  console.log('   • NODE_ENV=development');
  
  console.log('\n💡 Próximos passos:');
  console.log('   1. Execute: npm run dev:debug');
  console.log('   2. Abra: http://localhost:3000?debug=true');
  console.log('   3. Pressione F12 para ver os logs de debug');
  console.log('   4. Verifique se os dados estão sendo carregados');
  
  console.log('\n⚠️ Importante:');
  console.log('   • Substitua as URLs do Supabase pelos seus valores reais');
  console.log('   • Configure o JWT_SECRET com um valor seguro');
  console.log('   • Certifique-se de que o backend está rodando na porta 5000');
  
} catch (error) {
  console.error('❌ Erro ao configurar variáveis de ambiente:', error.message);
  process.exit(1);
} 