import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeeklyQuestions } from './use-weekly-questions';
import { useConcurso } from '@/contexts/ConcursoContext';

// Mock do contexto de concurso
jest.mock('@/contexts/ConcursoContext');
const mockUseConcurso = useConcurso as jest.MockedFunction<typeof useConcurso>;

// Mock do cliente API
jest.mock('@/lib/api');
const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
};

// Mock do fetch global
global.fetch = jest.fn();

describe('useWeeklyQuestions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock padrão do contexto de concurso
    mockUseConcurso.mockReturnValue({
      activeConcursoId: 'concurso-123',
      state: { isLoading: false },
      hasSelectedConcurso: true,
      token: 'token-123',
    });

    // Mock do fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          questao_semanal: {
            id: 'semana-1',
            numero_semana: 1,
            titulo: 'Semana 1',
            questoes: [],
          },
          questoes: [],
          historico: [],
          status: {
            semana_atual: 1,
            modo_desbloqueio: 'strict',
          },
        },
      }),
      headers: new Map([
        ['x-correlation-id', 'corr-123'],
        ['x-request-id', 'req-123'],
      ]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  describe('getAtual', () => {
    it('deve buscar a semana atual com sucesso', async () => {
      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      await waitFor(() => {
        expect(result.current.getAtual.isLoading).toBe(false);
      });

      expect(result.current.getAtual.data).toBeDefined();
      expect(result.current.getAtual.hasConcurso).toBe(true);
      expect(result.current.getAtual.concursoId).toBe('concurso-123');
    });

    it('deve lidar com erro na busca da semana atual', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      await waitFor(() => {
        expect(result.current.getAtual.isError).toBe(true);
      });

      expect(result.current.getAtual.error).toBeDefined();
    });
  });

  describe('getRoadmap', () => {
    it('deve buscar o roadmap com sucesso', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { numero_semana: 1, status: 'done' },
            { numero_semana: 2, status: 'current' },
            { numero_semana: 3, status: 'locked' },
          ],
        }),
        headers: new Map([
          ['x-correlation-id', 'corr-123'],
          ['x-request-id', 'req-123'],
        ]),
      });

      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      await waitFor(() => {
        expect(result.current.getRoadmap.isLoading).toBe(false);
      });

      expect(result.current.getRoadmap.data).toHaveLength(3);
    });
  });

  describe('getHistorico', () => {
    it('deve buscar o histórico com parâmetros', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'progresso-1',
              numero_semana: 1,
              concluido_em: '2024-01-01T00:00:00Z',
              pontuacao: 80,
            },
          ],
          pagination: { nextCursor: null, limit: 10, total: 1 },
        }),
        headers: new Map([
          ['x-correlation-id', 'corr-123'],
          ['x-request-id', 'req-123'],
        ]),
      });

      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });
      const historico = result.current.getHistorico('cursor-123', 20);

      await waitFor(() => {
        expect(historico.isLoading).toBe(false);
      });

      expect(historico.data?.data).toHaveLength(1);
      expect(historico.data?.pagination.limit).toBe(20);
    });
  });

  describe('concluirSemana', () => {
    it('deve concluir uma semana com sucesso', async () => {
      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      const input = {
        numero_semana: 1,
        respostas: [
          {
            questao_id: 'questao-1',
            resposta_selecionada: 2,
            tempo_segundos: 45,
          },
        ],
        pontuacao: 80,
        tempo_minutos: 15,
      };

      result.current.concluirSemana.mutate(input);

      await waitFor(() => {
        expect(result.current.concluirSemana.isLoading).toBe(false);
      });

      expect(result.current.concluirSemana.isSuccess).toBe(true);
    });

    it('deve aplicar estado otimista durante a conclusão', async () => {
      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      // Aguardar dados carregarem
      await waitFor(() => {
        expect(result.current.getAtual.data).toBeDefined();
      });

      const input = {
        numero_semana: 1,
        respostas: [
          {
            questao_id: 'questao-1',
            resposta_selecionada: 2,
            tempo_segundos: 45,
          },
        ],
        pontuacao: 90,
        tempo_minutos: 12,
      };

      // Simular conclusão
      result.current.concluirSemana.mutate(input);

      // Verificar se o estado otimista foi aplicado
      expect(result.current.getAtual.data?.historico).toHaveLength(1);
      expect(result.current.getAtual.data?.historico[0].pontuacao).toBe(90);
    });
  });

  describe('estados e utilitários', () => {
    it('deve fornecer estados agregados corretos', async () => {
      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      await waitFor(() => {
        expect(result.current.getAtual.data).toBeDefined();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.hasConcurso).toBe(true);
      expect(result.current.concursoId).toBe('concurso-123');
    });

    it('deve lidar com usuário sem concurso selecionado', () => {
      mockUseConcurso.mockReturnValueOnce({
        activeConcursoId: null,
        state: { isLoading: false },
        hasSelectedConcurso: false,
        token: null,
      });

      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      expect(result.current.hasConcurso).toBe(false);
      expect(result.current.concursoId).toBeNull();
    });
  });

  describe('hooks individuais', () => {
    it('deve fornecer hooks individuais funcionais', async () => {
      const { result } = renderHook(() => useWeeklyQuestions(), { wrapper });

      await waitFor(() => {
        expect(result.current.getAtual.data).toBeDefined();
      });

      // Verificar se os hooks individuais retornam os mesmos dados
      expect(result.current.getAtual.data).toEqual(
        expect.objectContaining({
          questao_semanal: expect.any(Object),
          questoes: expect.any(Array),
        })
      );
    });
  });
});
