// Tipos locais para o repositório de apostilas
export type ApostilaTable = {
  Row: {
    id: string;
    titulo: string;
    descricao?: string;
    concurso_id: string;
    created_at: string;
    updated_at: string;
  };
  Update: Partial<ApostilaTable['Row']>;
};

export type ConteudoApostila = {
  id: string;
  apostila_id: string;
  numero_modulo: number;
  titulo: string;
  conteudo_json: Record<string, unknown>;
  criado_em: string;
};

export type ProgressoApostila = {
  id: string;
  usuario_id: string;
  conteudo_apostila_id: string;
  concluido: boolean;
  percentual_progresso: number;
  atualizado_em: string;
};

export class ApostilaRepository {
  constructor() {}

  // Busca apostilas por concurso
  async findByConcurso(concursoId: string): Promise<ApostilaTable['Row'][]> {
    const res = await fetch(`/api/apostilas?concursoId=${encodeURIComponent(concursoId)}`);
    if (!res.ok) throw new Error('Erro ao buscar apostilas por concurso');
    return await res.json();
  }

  // Busca apostilas por categoria
  async findByCategoria(categoriaId: string): Promise<ApostilaTable['Row'][]> {
    const res = await fetch(`/api/apostilas?categoriaId=${encodeURIComponent(categoriaId)}`);
    if (!res.ok) throw new Error('Erro ao buscar apostilas por categoria');
    return await res.json();
  }

  // Busca o conteúdo de uma apostila
  async findConteudo(apostilaId: string): Promise<ConteudoApostila[]> {
    const res = await fetch(`/api/apostilas/${apostilaId}/modulos`);
    if (!res.ok) throw new Error('Erro ao buscar conteúdo da apostila');
    return await res.json();
  }

  // Atualiza o progresso do usuário em uma apostila
  async atualizarProgresso(
    userId: string,
    apostilaContentId: string,
    progresso: { concluido: boolean; percentualProgresso: number }
  ): Promise<ProgressoApostila> {
    const res = await fetch(`/api/apostilas/${apostilaContentId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...progresso }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar progresso da apostila');
    return await res.json();
  }

  // Busca o progresso do usuário em uma apostila
  async buscarProgresso(userId: string, apostilaContentId: string): Promise<ProgressoApostila> {
    const res = await fetch(`/api/apostilas/${apostilaContentId}/progress?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Erro ao buscar progresso da apostila');
    return await res.json();
  }
}