'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Carddescricao, 
  CardHeader, 
  Cardtitulo 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  BookOpen, 
  Target, 
  Building2, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useListarConcursos } from '@/src/features/concursos/hooks/use-concursos';
import { useCategorias } from '@/src/hooks/useCategorias';

// ========================================
// COMPONENTE
// ========================================

export function ConcursoSelector() {
  const { toast } = useToast();

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [selectedBanca, setSelectedBanca] = useState<string>('todas');
  const [selectedAno, setSelectedAno] = useState<string>('todos');
  const [selecting, setSelecting] = useState(false);

  // Buscar categorias com React Query
  const {
    categorias,
    isLoading: loadingCategorias,
    isError: isErrorCategorias,
    refetch: refetchCategorias
  } = useCategorias({ ativo: true });

  // Buscar concursos com React Query
  const {
    data: concursos = [],
    isLoading: loadingConcursos,
    isError: isErrorConcursos,
    refetch: refetchConcursos
  } = useListarConcursos({
    categoriaId: selectedCategoria !== 'todos' ? selectedCategoria : undefined,
    banca: selectedBanca !== 'todas' ? selectedBanca : undefined,
    anoMinimo: selectedAno !== 'todos' ? Number(selectedAno) : undefined,
    anoMaximo: selectedAno !== 'todos' ? Number(selectedAno) : undefined,
    search: searchTerm || undefined
  });

  // Filtrar concursos (caso precise de lógica extra além do backend)
  // Remover declaração duplicada de filteredConcursos
  // Substituir lógica de filtro para usar categoriaId e buscar nome da categoria
  const filteredConcursos = concursos.filter(concurso => {
    const categoria = categorias.find(cat => cat.id === concurso.categoriaId);
    const matchesSearch =
      concurso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (categoria && categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (concurso.banca && concurso.banca.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria =
      selectedCategoria === 'todos' || concurso.categoriaId === selectedCategoria;

    const matchesBanca =
      selectedBanca === 'todas' || concurso.banca === selectedBanca;

    const matchesAno =
      selectedAno === 'todos' || concurso.ano?.toString() === selectedAno;

    return matchesSearch && matchesCategoria && matchesBanca && matchesAno;
  });

  // Handler de seleção de concurso (mantém lógica original)
  const handleSelectConcurso = async (
    concursoId: string,
    categoriaId: string
  ) => {
    if (!categoriaId) {
      toast({
        title: 'Erro',
        descricao: 'Este concurso não pode ser selecionado pois não possui uma categoria.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    try {
      setSelecting(true);
      // Aqui você pode chamar uma mutation do React Query se houver
      // await selectConcurso(concursoId, categoriaId);
      toast({
        title: 'Concurso selecionado!',
        descricao: 'Seu painel foi personalizado para o concurso escolhido.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        descricao: error instanceof Error ? error.message : 'Não foi possível selecionar o concurso. Tente novamente.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setSelecting(false);
    }
  };

  // Estados de loading e erro
  if (loadingConcursos || loadingCategorias) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando concursos e categorias...</p>
        </div>
      </div>
    );
  }
  if (isErrorConcursos || isErrorCategorias) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-500 mb-2">Erro ao carregar dados.</p>
        <Button onClick={() => { refetchConcursos(); refetchCategorias(); }}>Tentar novamente</Button>
      </div>
    );
  }

  // ========================================
  // FILTRAR CONCURSOS
  // ========================================

  // ========================================
  // SELECIONAR CONCURSO
  // ========================================

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Selecione seu Concurso</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Escolha o concurso que você está estudando. Seu painel será personalizado 
          exclusivamente para este concurso, incluindo simulados, flashcards e apostilas específicas.
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Você poderá trocar de concurso após 4 meses</span>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <Cardtitulo className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtrar Concursos</span>
          </Cardtitulo>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, categoria ou banca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoria */}
            <Select
              value={selectedCategoria}
              onValueChange={setSelectedCategoria}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Banca */}
            <Select value={selectedBanca} onValueChange={setSelectedBanca}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as bancas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as bancas</SelectItem>
                <SelectItem value="CESPE/CEBRASPE">CESPE/CEBRASPE</SelectItem>
                <SelectItem value="CESGRANRIO">CESGRANRIO</SelectItem>
                <SelectItem value="FGV">FGV</SelectItem>
                <SelectItem value="VUNESP">VUNESP</SelectItem>
                <SelectItem value="FEPESE">FEPESE</SelectItem>
                <SelectItem value="FUNDEP">FUNDEP</SelectItem>
                <SelectItem value="IADES">IADES</SelectItem>
                <SelectItem value="INEP">INEP</SelectItem>
                <SelectItem value="FUVEST">FUVEST</SelectItem>
              </SelectContent>
            </Select>

            {/* Ano */}
            <Select value={selectedAno} onValueChange={setSelectedAno}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Concursos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Concursos Disponíveis ({filteredConcursos.length})
          </h2>
          {loadingConcursos && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>

        {filteredConcursos.length === 0 && !loadingConcursos ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum concurso encontrado com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConcursos.map((concurso) => {
              const categoria = categorias.find(cat => cat.id === concurso.categoriaId);
              return (
                <Card key={concurso.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Cardtitulo className="text-lg">{concurso.nome}</Cardtitulo>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {categoria?.nome || 'Sem categoria'}
                          </Badge>
                          {concurso.banca && (
                            <Badge variant="outline">{concurso.banca}</Badge>
                          )}
                          {concurso.ano && (
                            <Badge variant="outline">{concurso.ano}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {concurso.descricao && (
                      <Carddescricao className="text-sm">
                        {concurso.descricao}
                      </Carddescricao>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {categoria?.nome || 'Sem categoria'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectConcurso(concurso.id, concurso.categoriaId || '')}
                      disabled={selecting}
                      className="w-full"
                    >
                      {selecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Selecionando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Selecionar Concurso
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 