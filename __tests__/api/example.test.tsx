import { jest } from '@jest/globals';
import { NextApiRequest, NextApiResponse } from 'next';
import exampleApi from '../../pages/api/example';

// Mocks globais
const mockFrom = jest.fn();
const mockSelect = jest.fn();

// Mock do módulo supabase
const mockCreateServerSupabaseClient = jest.fn(() => ({
  from: mockFrom,
  select: mockSelect,
}));

jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

// Tipos para os mocks
interface MockResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
  status: number;
  statusText: string;
}

interface MockQueryBuilder<T = unknown> {
  then: (callback: (response: MockResponse<T>) => unknown) => Promise<unknown>;
  data: T | null;
  error: { message: string } | null;
  status: number;
  statusText: string;
}

describe('API Route: /api/example', () => {
  let req: Partial<NextApiRequest> & {
    method?: string;
    body?: unknown;
    query?: Record<string, unknown>;
  };
  let res: Partial<NextApiResponse> & {
    status: jest.Mock;
    json: jest.Mock;
    end: jest.Mock;
    setHeader: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configura os mocks
    mockFrom.mockReset();
    mockSelect.mockReset();
    
    // Configura o mock padrão para select
    const mockResponse: MockResponse = {
      data: [],
      error: null,
      status: 200,
      statusText: 'OK',
    };
    
    const mockQueryBuilder: MockQueryBuilder = {
      ...mockResponse,
      then: (callback) => Promise.resolve(callback(mockResponse)),
    };
    
    mockSelect.mockImplementation(() => mockQueryBuilder);
    mockFrom.mockImplementation(() => ({
      select: () => mockQueryBuilder,
    }));
    
    // Configura a requisição
    req = {
      method: 'GET',
      query: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
      setHeader: jest.fn(),
    };
  });

  it('deve retornar 405 para método não permitido', async () => {
    req.method = 'POST';

    await exampleApi(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Método não permitido',
      })
    );
  });

  it('deve retornar dados com sucesso', async () => {
    // Configura o mock para retornar dados
    const mockData = [{ id: 1, name: 'Test Item' }];
    const mockResponse: MockResponse<typeof mockData> = {
      data: mockData,
      error: null,
      status: 200,
      statusText: 'OK',
    };
    
    const mockQueryBuilder: MockQueryBuilder<typeof mockData> = {
      ...mockResponse,
      then: (callback) => Promise.resolve(callback(mockResponse)),
    };
    
    mockSelect.mockImplementationOnce(() => mockQueryBuilder);

    await exampleApi(req, res);

    // Verifica se as funções foram chamadas corretamente
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockSelect).toHaveBeenCalledWith('*');
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
      })
    );
  });

  it('deve lidar com erros do Supabase', async () => {
    // Configura o mock para retornar um erro
    const errorMessage = 'Erro ao buscar dados';
    const mockErrorResponse: MockResponse<null> = {
      data: null,
      error: { message: errorMessage },
      status: 500,
      statusText: 'Internal Server Error',
    };
    
    const mockErrorQueryBuilder: MockQueryBuilder<null> = {
      ...mockErrorResponse,
      then: (callback) => Promise.resolve(callback(mockErrorResponse)),
    };
    
    mockSelect.mockImplementationOnce(() => mockErrorQueryBuilder);

    await exampleApi(req, res);

    // Verifica se as funções foram chamadas corretamente
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockSelect).toHaveBeenCalledWith('*');
    
    // Verifica a resposta de erro
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: errorMessage,
      })
    );
  });
});
