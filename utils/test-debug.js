// Script para testar o sistema de debug
// Execute este script no console do navegador

console.log('🧪 Testando sistema de debug...');

// Verificar se os helpers estão disponíveis
if (typeof window !== 'undefined') {
  console.log('📊 Status do sistema:');
  console.log('- debugHelpers:', !!window.debugHelpers);
  console.log('- apiInterceptor:', !!window.apiInterceptor);
  console.log('- addDebugData:', !!window.addDebugData);
  
  // Testar debugHelpers se disponível
  if (window.debugHelpers) {
    console.log('✅ debugHelpers está disponível');
    try {
      window.debugHelpers.showHelp();
    } catch (error) {
      console.error('❌ Erro ao executar debugHelpers.showHelp():', error);
    }
  } else {
    console.log('❌ debugHelpers não está disponível');
  }
  
  // Testar apiInterceptor se disponível
  if (window.apiInterceptor) {
    console.log('✅ apiInterceptor está disponível');
    try {
      const stats = window.apiInterceptor.getStats();
      console.log('📈 Estatísticas da API:', stats);
    } catch (error) {
      console.error('❌ Erro ao executar apiInterceptor.getStats():', error);
    }
  } else {
    console.log('❌ apiInterceptor não está disponível');
  }
  
  // Testar addDebugData se disponível
  if (window.addDebugData) {
    console.log('✅ addDebugData está disponível');
    try {
      window.addDebugData({
        type: 'info',
        title: 'Teste do Sistema',
        data: { message: 'Sistema de debug funcionando!' }
      });
      console.log('✅ Log de teste adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao executar addDebugData():', error);
    }
  } else {
    console.log('❌ addDebugData não está disponível');
  }
  
  // Verificar localStorage
  const debugEnabled = localStorage.getItem('debug');
  console.log('- Debug habilitado no localStorage:', debugEnabled);
  
} else {
  console.log('❌ window não está disponível (SSR)');
}

console.log('🧪 Teste concluído!'); 