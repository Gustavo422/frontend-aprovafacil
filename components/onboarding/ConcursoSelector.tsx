'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar, 
  Building2, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useConcursoActions } from '@/contexts/ConcursoContext';
import { 
  ConcursoCategoria, 
  ConcursoComCategoria
} from '@/types/concurso';
import { logger } from '@/lib/logger';

// ========================================
// TIPOS
// ========================================

// ========================================
// COMPONENTE
// ========================================

export function ConcursoSelector() {
  const { toast } = useToast();
  const { selectConcurso, loadConcursosByCategory } = useConcursoActions();
  
  const [categorias, setCategorias] = useState<ConcursoCategoria[]>([]);
  const [concursos, setConcursos] = useState<ConcursoComCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [selectedBanca, setSelectedBanca] = useState<string>('todas');
  const [selectedAno, setSelectedAno] = useState<string>('todos');

  // ========================================
  // CARREGAR DADOS
  // ========================================

  const loadAllConcursos = useCallback(async () => {
    try {
      const response = await fetch('/api/concursos?ativo=true');
      if (response.ok) {
        const data = await response.json();
        // Log temporário para verificar dados
        console.log('[DEBUG] ConcursoSelector - Dados de concursos recebidos:', {
          hasData: !!data,
          dataStructure: data ? Object.keys(data) : 'no data',
          dataData: data.data,
          dataLength: data.data?.length || 0
        });
        // Padrão padronizado: sempre acessar via data.data
        setConcursos(data.data || []);
      }
    } catch (error) {
      logger.error('Erro ao carregar concursos:', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const response = await fetch('/api/concurso-categorias?ativo=true');
        if (response.ok) {
          const data = await response.json();
          // Log temporário para verificar dados
          console.log('[DEBUG] ConcursoSelector - Dados de categorias recebidos:', {
            hasData: !!data,
            dataStructure: data ? Object.keys(data) : 'no data',
            dataData: data.data,
            dataLength: data.data?.length || 0
          });
          setCategorias(data.data || []);
        }
      } catch (error) {
        logger.error('Erro ao carregar categorias:', { error });
      }
    };
    loadCategorias();
  }, []);

  useEffect(() => {
    if (selectedCategoria !== 'todos') {
      loadConcursosByCategory(selectedCategoria);
    } else {
      loadAllConcursos();
    }
  }, [selectedCategoria, loadConcursosByCategory, loadAllConcursos]);

  // ========================================
  // FILTRAR CONCURSOS
  // ========================================

  const filteredConcursos = concursos.filter(concurso => {
    const matchesSearch = 
      concurso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (concurso.categoria?.nome && 
       concurso.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (concurso.banca && concurso.banca.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria = 
      selectedCategoria === 'todos' || 
      concurso.categoria?.id === selectedCategoria;

    const matchesBanca = 
      selectedBanca === 'todas' || 
      concurso.banca === selectedBanca;

    const matchesAno = 
      selectedAno === 'todos' || 
      concurso.ano?.toString() === selectedAno;

    return matchesSearch && matchesCategoria && matchesBanca && matchesAno;
  });

  // ========================================
  // SELECIONAR CONCURSO
  // ========================================

  const handleSelectConcurso = async (concursoId: string, categoriaId: string) => {
    try {
      console.log('[DEBUG] Iniciando seleção de concurso:', { concursoId, categoriaId });
      setSelecting(true);
      
      console.log('[DEBUG] Chamando selectConcurso...');
      await selectConcurso(concursoId, categoriaId);
      console.log('[DEBUG] selectConcurso concluído com sucesso');
      
      toast({
        title: "Concurso selecionado!",
        descricao: "Seu painel foi personalizado para o concurso escolhido.",
        duration: 3000,
      });
      
      console.log('[DEBUG] Redirecionando para dashboard...');
      // Forçar navegação completa para garantir que a página mude
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('[DEBUG] Erro ao selecionar concurso:', error);
      logger.error('Erro ao selecionar concurso:', { error });
      toast({
        title: "Erro",
        descricao: error instanceof Error ? error.message : "Não foi possível selecionar o concurso. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSelecting(false);
    }
  };

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando concursos...</p>
        </div>
      </div>
    );
  }

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
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
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
        </div>

        {filteredConcursos.length === 0 ? (
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
            {filteredConcursos.map((concurso) => (
              <Card key={concurso.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Cardtitulo className="text-lg">{concurso.nome}</Cardtitulo>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {concurso.categoria?.nome || 'Sem categoria'}
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
                      <span>{concurso.categoria?.nome || 'Sem categoria'}</span>
                    </div>
                    {concurso.data_prova && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(concurso.data_prova).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectConcurso(concurso.id, concurso.categoria?.id || '')}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}