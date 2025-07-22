/**
 * Exemplo de uso das ferramentas de debug com navegação e rotas
 */

'use client';

import { useState } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import { measure } from '../../utils/performance-debug';

// Criar debuggers específicos para este módulo
const routerDebug = createModuleDebugger('router', 'navigation');
const componentDebug = createModuleDebugger('component', 'routerDebug');

// Simular páginas para navegação
const pages = {
  home: {
    title: 'Página Inicial',
    content: 'Bem-vindo à página inicial. Navegue usando os links acima.'
  },
  about: {
    title: 'Sobre',
    content: 'Esta é a página sobre. Aqui você encontra informações sobre o projeto.'
  },
  contact: {
    title: 'Contato',
    content: 'Entre em contato conosco através do formulário abaixo.'
  },
  products: {
    title: 'Produtos',
    content: 'Confira nossa lista de produtos disponíveis.'
  }
};

type PageKey = keyof typeof pages;

export default function RouterDebugExample() {
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const [navigationHistory, setNavigationHistory] = useState<PageKey[]>(['home']);
  const [, setNavigationTiming] = useState<Record<string, number>>({});
  
  // Função para navegar entre páginas com debug
  const navigateTo = (page: PageKey) => {
    componentDebug(`Botão de navegação para ${page} clicado`);
    
    // Usar measure para medir o tempo de navegação
    measure(`navigation-to-${page}`, () => {
      routerDebug.info(`Navegando para: ${page}`);
      
      // Simular verificações de rota
      routerDebug.debug(`Verificando permissões para acessar: ${page}`);
      
      // Simular carregamento de dados
      routerDebug.debug(`Carregando dados para: ${page}`);
      
      // Atualizar estado
      setCurrentPage(page);
      setNavigationHistory(prev => [...prev, page]);
      
      // Registrar tempo de navegação
      const timing = performance.now();
      setNavigationTiming(prev => ({
        ...prev,
        [page]: timing
      }));
      
      routerDebug.info(`Navegação para ${page} concluída`);
      
      // Simular evento de analytics
      routerDebug.debug(`Enviando evento de analytics: page_view - ${page}`);
    });
  };
  
  // Função para voltar na navegação
  const goBack = () => {
    componentDebug('Botão de voltar clicado');
    
    if (navigationHistory.length <= 1) {
      routerDebug.warn('Tentativa de voltar, mas não há histórico anterior');
      return;
    }
    
    measure('navigation-back', () => {
      // Remover página atual do histórico
      const newHistory = [...navigationHistory];
      newHistory.pop();
      
      // Obter página anterior
      const previousPage = newHistory[newHistory.length - 1];
      
      routerDebug.info(`Voltando para: ${previousPage}`);
      
      // Atualizar estado
      setCurrentPage(previousPage);
      setNavigationHistory(newHistory);
      
      routerDebug.info(`Navegação de volta para ${previousPage} concluída`);
    });
  };
  
  // Registrar cada renderização
  componentDebug('Renderizando RouterDebugExample');
  componentDebug.debug(`Página atual: ${currentPage}`);
  componentDebug.debug(`Histórico de navegação: ${navigationHistory.join(' -> ')}`);
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Debug com Rotas</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de debug com navegação e rotas.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:router:*,app:frontend:component:routerDebug&apos;</code> para ver os logs.
      </p>
      
      {/* Barra de navegação */}
      <nav className="flex gap-2 mb-6">
        {Object.keys(pages).map((page) => (
          <button
            key={page}
            onClick={() => navigateTo(page as PageKey)}
            className={`px-4 py-2 rounded ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {pages[page as PageKey].title}
          </button>
        ))}
        
        <button
          onClick={goBack}
          disabled={navigationHistory.length <= 1}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          Voltar
        </button>
      </nav>
      
      {/* Conteúdo da página */}
      <div className="p-6 border rounded bg-gray-50">
        <h3 className="text-xl font-bold mb-4">{pages[currentPage].title}</h3>
        <p>{pages[currentPage].content}</p>
      </div>
      
      {/* Informações de debug */}
      <div className="mt-6 p-4 border rounded bg-gray-100">
        <h4 className="font-bold mb-2">Informações de Debug</h4>
        <div className="text-sm">
          <p>Página atual: <code>{currentPage}</code></p>
          <p>Histórico: <code>{navigationHistory.join(' -> ')}</code></p>
          <p>Número de navegações: <code>{navigationHistory.length - 1}</code></p>
        </div>
      </div>
    </div>
  );
}