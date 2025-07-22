/**
 * Script de inicialização do sistema de debug
 * 
 * Este arquivo pode ser importado no ponto de entrada da aplicação
 * para garantir que o sistema de debug seja inicializado corretamente.
 */

import { autoInitializeDebug } from './debug-tools';

// Inicializar o sistema de debug
autoInitializeDebug();

// Exportar uma função vazia para evitar que o bundler remova este arquivo
export function ensureDebugInitialized(): void {
  // Esta função não faz nada, apenas garante que o módulo seja importado
}