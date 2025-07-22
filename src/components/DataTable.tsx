import React, { useState, useMemo } from 'react';

/**
 * Definição de coluna da tabela
 */
export interface Column<T> {
  /**
   * Chave da coluna (deve corresponder a uma propriedade do objeto)
   */
  key: keyof T | string;
  
  /**
   * Título da coluna
   */
  title: string;
  
  /**
   * Função de renderização personalizada
   */
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  
  /**
   * Se a coluna é ordenável
   */
  sortable?: boolean;
  
  /**
   * Largura da coluna
   */
  width?: string | number;
  
  /**
   * Alinhamento do conteúdo
   */
  align?: 'left' | 'center' | 'right';
  
  /**
   * Se a coluna está fixa
   */
  fixed?: 'left' | 'right';
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  /**
   * Página atual
   */
  current: number;
  
  /**
   * Tamanho da página
   */
  pageSize: number;
  
  /**
   * Total de itens
   */
  total: number;
  
  /**
   * Callback de mudança de página
   */
  onChange: (page: number, pageSize: number) => void;
  
  /**
   * Opções de tamanho de página
   */
  pageSizeOptions?: number[];
  
  /**
   * Se deve mostrar informações de total
   */
  showTotal?: boolean;
  
  /**
   * Se deve mostrar seletor de tamanho de página
   */
  showSizeChanger?: boolean;
}

/**
 * Props do DataTable
 */
export interface DataTableProps<T> {
  /**
   * Dados da tabela
   */
  data: T[];
  
  /**
   * Definições das colunas
   */
  columns: Column<T>[];
  
  /**
   * Se está carregando
   */
  loading?: boolean;
  
  /**
   * Mensagem quando não há dados
   */
  emptyText?: string;
  
  /**
   * Configurações de paginação
   */
  pagination?: PaginationOptions | false;
  
  /**
   * Callback de seleção de linhas
   */
  onRowSelect?: (selectedRows: T[], selectedRowKeys: string[]) => void;
  
  /**
   * Chave única para cada linha
   */
  rowKey?: keyof T | ((record: T) => string);
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
  
  /**
   * Se deve mostrar cabeçalho
   */
  showHeader?: boolean;
  
  /**
   * Altura da tabela (para scroll vertical)
   */
  height?: number;
  
  /**
   * Callback de clique na linha
   */
  onRowClick?: (record: T, index: number) => void;
}

/**
 * Componente de tabela de dados
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyText = 'Nenhum dado encontrado',
  pagination,
  onRowSelect,
  rowKey = 'id',
  className = '',
  showHeader = true,
  height,
  onRowClick
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  
  // Função para obter a chave da linha
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] || index);
  };
  
  // Dados ordenados
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];
      
      if (aValue === bValue) return 0;
      
      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }, [data, sortColumn, sortDirection]);
  
  // Manipular ordenação
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };
  
  // Manipular seleção de linha
  const handleRowSelect = (rowKey: string, selected: boolean) => {
    let newSelectedRowKeys: string[];
    
    if (selected) {
      newSelectedRowKeys = [...selectedRowKeys, rowKey];
    } else {
      newSelectedRowKeys = selectedRowKeys.filter(key => key !== rowKey);
    }
    
    setSelectedRowKeys(newSelectedRowKeys);
    
    if (onRowSelect) {
      const selectedRows = data.filter(record => 
        newSelectedRowKeys.includes(getRowKey(record, data.indexOf(record)))
      );
      onRowSelect(selectedRows, newSelectedRowKeys);
    }
  };
  
  // Manipular seleção de todas as linhas
  const handleSelectAll = (selected: boolean) => {
    const newSelectedRowKeys = selected 
      ? data.map((record, index) => getRowKey(record, index))
      : [];
    
    setSelectedRowKeys(newSelectedRowKeys);
    
    if (onRowSelect) {
      const selectedRows = selected ? data : [];
      onRowSelect(selectedRows, newSelectedRowKeys);
    }
  };
  
  // Verificar se todas as linhas estão selecionadas
  const isAllSelected = data.length > 0 && selectedRowKeys.length === data.length;
  const isIndeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < data.length;
  
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Carregando...</span>
          </div>
        </div>
      )}
      
      {/* Tabela */}
      <div className="overflow-hidden">
        <div 
          className="overflow-auto"
          style={{ maxHeight: height ? `${height}px` : undefined }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            {/* Cabeçalho */}
            {showHeader && (
              <thead className="bg-gray-50">
                <tr>
                  {/* Coluna de seleção */}
                  {onRowSelect && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={isAllSelected}
                        ref={input => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                  )}
                  
                  {/* Colunas */}
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key) || index}
                      className={`
                        px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                        ${column.className || ''}
                      `}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(String(column.key))}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.title}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            <svg
                              className={`h-3 w-3 ${
                                sortColumn === column.key && sortDirection === 'asc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg
                              className={`h-3 w-3 ${
                                sortColumn === column.key && sortDirection === 'desc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            
            {/* Corpo */}
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (onRowSelect ? 1 : 0)}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{emptyText}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((record, index) => {
                  const key = getRowKey(record, index);
                  const isSelected = selectedRowKeys.includes(key);
                  
                  return (
                    <tr
                      key={key}
                      className={`
                        hover:bg-gray-50 transition-colors duration-150
                        ${isSelected ? 'bg-blue-50' : ''}
                        ${onRowClick ? 'cursor-pointer' : ''}
                      `}
                      onClick={() => onRowClick?.(record, index)}
                    >
                      {/* Coluna de seleção */}
                      {onRowSelect && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowSelect(key, e.target.checked);
                            }}
                          />
                        </td>
                      )}
                      
                      {/* Colunas de dados */}
                      {columns.map((column, colIndex) => {
                        const value = record[column.key as keyof T];
                        const content = column.render 
                          ? column.render(value, record, index)
                          : String(value || '');
                        
                        return (
                          <td
                            key={String(column.key) || colIndex}
                            className={`
                              px-6 py-4 whitespace-nowrap text-sm
                              ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                              ${column.className || ''}
                            `}
                            style={{ width: column.width }}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Paginação */}
      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              {pagination.showTotal && (
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(pagination.current - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  até{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  resultados
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {pagination.showSizeChanger && pagination.pageSizeOptions && (
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onChange(1, Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {pagination.pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                      {size} por página
                    </option>
                  ))}
                </select>
              )}
              
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Números das páginas */}
                {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                  .filter(page => {
                    const current = pagination.current;
                    return page === 1 || page === Math.ceil(pagination.total / pagination.pageSize) || 
                           (page >= current - 2 && page <= current + 2);
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => pagination.onChange(page, pagination.pageSize)}
                          className={`
                            relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${page === pagination.current
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }
                          `}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                
                <button
                  onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}