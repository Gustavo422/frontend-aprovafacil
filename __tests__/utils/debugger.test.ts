/**
 * Testes para o utilitário de debug do frontend
 * 
 * Este arquivo contém testes para verificar o funcionamento correto da biblioteca debug
 * no ambiente do frontend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import debug from 'debug';
import { 
  createDebugger, 
  createModuleDebugger, 
  enableAllDebug, 
  disableAllDebug, 
  getEnabledNamespaces
} from '../../utils/debugger';

// Mock da função de log da biblioteca debug para capturar saídas
const originalDebugLog = debug.log;
let consoleOutput: any[] = [];

describe('Utilitário de Debug do Frontend', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks();
    
    // Mock da função de log da biblioteca debug para capturar saídas
    consoleOutput = [];
    debug.log = vi.fn((...args) => {
      consoleOutput.push(args);
    });
    
    // Garantir que o debug está desativado antes de cada teste
    disableAllDebug();
  });
  
  afterEach(() => {
    // Restaurar função de log original da biblioteca debug
    debug.log = originalDebugLog;
  });
  
  describe('Criação de instâncias de debug', () => {
    it('deve criar uma instância de debug com namespace correto', () => {
      const testDebug = createDebugger('test');
      expect(testDebug.namespace).toBe('app:frontend:test');
    });
    
    it('deve criar uma instância de debug para um módulo específico', () => {
      const moduleDebug = createModuleDebugger('component', 'button');
      expect(moduleDebug.namespace).toBe('app:frontend:component:button');
    });
    
    it('deve permitir a criação de sub-namespaces', () => {
      const testDebug = createDebugger('test');
      const subDebug = testDebug.extend('sub');
      expect(subDebug.namespace).toBe('app:frontend:test:sub');
    });
  });
  
  describe('Ativação e desativação de categorias', () => {
    it('deve ativar todos os namespaces do aplicativo', () => {
      enableAllDebug();
      const testDebug = createDebugger('test');
      expect(testDebug.enabled).toBe(true);
    });
    
    it('deve desativar todos os namespaces do aplicativo', () => {
      // Primeiro ativa
      enableAllDebug();
      
      // Depois desativa
      disableAllDebug();
      
      const testDebug = createDebugger('test');
      expect(testDebug.enabled).toBe(false);
    });
    
    it('deve retornar os namespaces atualmente habilitados', () => {
      // Ativa um namespace específico
      debug.enable('app:frontend:test:*');
      
      const namespaces = getEnabledNamespaces();
      expect(namespaces).toContain('app:frontend:test:*');
    });
    
    it('deve respeitar a ativação seletiva de namespaces', () => {
      // Ativa apenas um namespace específico
      debug.enable('app:frontend:test');
      
      const testDebug = createDebugger('test');
      const otherDebug = createDebugger('other');
      
      expect(testDebug.enabled).toBe(true);
      expect(otherDebug.enabled).toBe(false);
    });
  });
  
  describe('Níveis de log', () => {
    beforeEach(() => {
      // Ativar debug para os testes
      enableAllDebug();
    });
    
    it('deve registrar logs com nível debug', () => {
      const testDebug = createDebugger('test');
      
      testDebug.debug('Mensagem de teste');
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      // Verifica se a saída contém a string [DEBUG]
      expect(JSON.stringify(consoleOutput)).toContain('[DEBUG]');
    });
    
    it('deve registrar logs com nível info', () => {
      const testDebug = createDebugger('test');
      
      testDebug.info('Mensagem de teste');
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      // Verifica se a saída contém a string [INFO]
      expect(JSON.stringify(consoleOutput)).toContain('[INFO]');
    });
    
    it('deve registrar logs com nível warn', () => {
      const testDebug = createDebugger('test');
      
      testDebug.warn('Mensagem de teste');
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      // Verifica se a saída contém a string [WARN]
      expect(JSON.stringify(consoleOutput)).toContain('[WARN]');
    });
    
    it('deve registrar logs com nível error', () => {
      const testDebug = createDebugger('test');
      
      testDebug.error('Mensagem de teste');
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      // Verifica se a saída contém a string [ERROR]
      expect(JSON.stringify(consoleOutput)).toContain('[ERROR]');
    });
  });
  
  describe('Comportamento quando desativado', () => {
    beforeEach(() => {
      // Garantir que o debug está desativado
      disableAllDebug();
    });
    
    it('não deve registrar logs quando o debug está desativado', () => {
      const testDebug = createDebugger('test');
      
      testDebug('Mensagem de teste');
      testDebug.debug('Mensagem de teste');
      testDebug.info('Mensagem de teste');
      testDebug.warn('Mensagem de teste');
      testDebug.error('Mensagem de teste');
      
      expect(consoleOutput.length).toBe(0);
    });
  });
  
  describe('Opções de configuração', () => {
    beforeEach(() => {
      // Ativar debug para os testes
      enableAllDebug();
    });
    
    it('deve respeitar a opção service', () => {
      const testDebug = createDebugger('test', { service: 'custom-service' });
      
      testDebug('Mensagem de teste');
      
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
    
    it('deve respeitar a opção includeTimestamp quando definida como false', () => {
      const testDebug = createDebugger('test', { includeTimestamp: false });
      
      testDebug('Mensagem de teste');
      
      // Verificar se a saída não contém um timestamp no formato ISO
      const output = JSON.stringify(consoleOutput);
      const timestampRegex = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(output).not.toMatch(timestampRegex);
    });
  });
  
  describe('Formatação de mensagens', () => {
    beforeEach(() => {
      // Ativar debug para os testes
      enableAllDebug();
    });
    
    it('deve formatar corretamente strings com placeholders', () => {
      const testDebug = createDebugger('test');
      
      testDebug('Teste %s %d', 'string', 123);
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      const output = JSON.stringify(consoleOutput);
      expect(output).toContain('string');
      expect(output).toContain('123');
    });
    
    it('deve formatar corretamente objetos', () => {
      const testDebug = createDebugger('test');
      const testObj = { name: 'test', value: 42 };
      
      testDebug('Objeto: %o', testObj);
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      const output = JSON.stringify(consoleOutput);
      expect(output).toContain('test');
      expect(output).toContain('42');
    });
  });
});