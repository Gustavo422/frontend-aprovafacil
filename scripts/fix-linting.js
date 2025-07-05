const fs = require('fs');
const path = require('path');

// Função para remover console statements
function removeConsoleStatements(content) {
  let modified = false;
  
  // Remover console.log, console.error, console.warn
  const consolePatterns = [
    /console\.log\([^)]*\);?\n?/g,
    /console\.error\([^)]*\);?\n?/g,
    /console\.warn\([^)]*\);?\n?/g,
    /console\.info\([^)]*\);?\n?/g
  ];
  
  consolePatterns.forEach(pattern => {
    if (content.match(pattern)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  return { content, modified };
}

// Função para remover imports não utilizados
function removeUnusedImports(content) {
  let modified = false;
  
  // Padrões comuns de imports não utilizados
  const unusedImportPatterns = [
    /import\s*{\s*useSafeAction\s*}\s*from\s*['"][^'"]*['"];?\n?/g,
    /import\s*{\s*[^}]*}\s*from\s*['"][^'"]*['"];?\s*\/\/\s*unused/g,
  ];
  
  unusedImportPatterns.forEach(pattern => {
    if (content.match(pattern)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  return { content, modified };
}

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;
    
    // Aplicar correções
    const consoleResult = removeConsoleStatements(modifiedContent);
    modifiedContent = consoleResult.content;
    hasChanges = hasChanges || consoleResult.modified;
    
    const importResult = removeUnusedImports(modifiedContent);
    modifiedContent = importResult.content;
    hasChanges = hasChanges || importResult.modified;
    
    // Salvar se houve modificações
    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

// Função para processar diretório recursivamente
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  });
}

// Executar o script
console.log('🔧 Iniciando correção automática de linting...');
processDirectory('./components');
processDirectory('./lib');
processDirectory('./app');
console.log('✅ Correção automática concluída!');
console.log('\n💡 Dicas para evitar problemas futuros:');
console.log('1. Rode "npm run lint" regularmente durante o desenvolvimento');
console.log('2. Configure seu editor para mostrar erros de linting em tempo real');
console.log('3. Use "npm run lint -- --fix" para corrigir automaticamente problemas simples'); 