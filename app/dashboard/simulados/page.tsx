'use client';
import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { ConcursoComCategoria, ConcursoCategoria } from '@/types/concurso';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Clock, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Simulado {
  id: string;
  title: string;
  description: string | null;
  questions_count: number;
  time_minutes: number;
  difficulty: string;
  created_at: string;
  concurso_id: string | null;
  is_public: boolean;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  concursos?: ConcursoComCategoria;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Fácil':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Médio':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Difícil':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [categorias, setCategorias] = useState<ConcursoCategoria[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [simuladosRes, categoriasRes] = await Promise.all([
          fetch('/api/simulados'),
          fetch('/api/concurso-categorias'),
        ]);

        if (simuladosRes.ok) {
          const data = await simuladosRes.json();
          setSimulados(data.data || []);
        }

        if (categoriasRes.ok) {
          const data = await categoriasRes.json();
          setCategorias(data.data || []);
        }
      } catch (error) {
        logger.error('Erro ao buscar dados da página de simulados', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSimulados = simulados.filter(simulado => {
    const matchesSearch =
      simulado.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (simulado.description &&
        simulado.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'todos' ||
      (simulado.concursos?.concurso_categorias?.slug === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">
          Pratique com simulados completos para testar seus conhecimentos.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título ou descrição..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              {categorias.map(categoria => (
                <SelectItem
                  key={categoria.id}
                  value={categoria.slug ?? ''}
                >
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Simulados Grid */}
      {filteredSimulados.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Nenhum simulado encontrado
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'todos'
              ? 'Tente ajustar os filtros de busca.'
              : 'Não há simulados disponíveis no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSimulados.map(simulado => (
            <Card key={simulado.id} className="card-hover flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex flex-col gap-1 items-end">
                    {simulado.concursos?.concurso_categorias && (
                      <Badge variant="secondary" className="text-xs">
                        {simulado.concursos.concurso_categorias.nome}
                      </Badge>
                    )}
                    {simulado.concursos?.ano && (
                      <Badge variant="outline" className="text-xs">
                        {simulado.concursos.ano}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {simulado.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {simulado.description || 'Simulado para prática de questões.'}
                </CardDescription>
                {simulado.concursos && (
                  <div className="text-xs text-muted-foreground">
                    Concurso: {simulado.concursos.nome}
                    {simulado.concursos.banca &&
                      ` • ${simulado.concursos.banca}`}
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{simulado.questions_count} questões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{simulado.time_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Dificuldade:
                  </span>
                  <Badge className={getDifficultyColor(simulado.difficulty)}>
                    {simulado.difficulty}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Link
                  href={`/dashboard/simulados/${simulado.id}`}
                  className="w-full"
                >
                  <Button className="w-full">Iniciar Simulado</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
