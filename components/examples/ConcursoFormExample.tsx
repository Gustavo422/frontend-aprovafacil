'use client';

import React, { useState } from 'react';
import { useCriarConcurso } from '@/src/features/concursos/hooks/use-concursos';
import { useCategorias } from '@/src/hooks/useCategorias';
import { useToast } from '@/features/shared/hooks/use-toast';
import { Card, CardContent, CardHeader, Cardtitulo } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ConcursoFormData {
  nome: string;
  descricao: string;
  ano: number;
  banca: string;
  categoriaId: string;
  nivel_dificuldade: 'facil' | 'medio' | 'dificil';
  multiplicador_questoes: number;
}

export function ConcursoFormExample() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ConcursoFormData>({
    nome: '',
    descricao: '',
    ano: new Date().getFullYear(),
    banca: '',
    categoriaId: '',
    nivel_dificuldade: 'medio',
    multiplicador_questoes: 1.0,
  });

  // Buscar categorias para o select
  const {
    categorias,
    isLoading: loadingCategorias,
    isError: isErrorCategorias,
    error: errorCategorias,
  } = useCategorias({ ativo: true });

  // Mutation para criar concurso
  const {
    mutate: criarConcurso,
    isPending: isCreating,
    isError: isErrorCreating,
    error: errorCreating,
  } = useCriarConcurso();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.categoriaId) {
      toast({
        title: 'Dados incompletos',
        descricao: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    criarConcurso(formData, {
      onSuccess: () => {
        toast({
          title: 'Concurso criado!',
          descricao: 'O concurso foi criado com sucesso.',
        });
        // Limpar formulário
        setFormData({
          nome: '',
          descricao: '',
          ano: new Date().getFullYear(),
          banca: '',
          categoriaId: '',
          nivel_dificuldade: 'medio',
          multiplicador_questoes: 1.0,
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao criar concurso',
          descricao: error.message || 'Não foi possível criar o concurso.',
          variant: 'destructive',
        });
      },
    });
  };

  const updateFormData = (field: keyof ConcursoFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingCategorias) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando categorias...</p>
      </div>
    );
  }

  if (isErrorCategorias) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-500 mb-2">Erro ao carregar categorias</p>
        <p className="text-sm text-muted-foreground">{errorCategorias?.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <Cardtitulo className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Criar Novo Concurso</span>
          </Cardtitulo>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome do Concurso *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => updateFormData('nome', e.target.value)}
                placeholder="Ex: Concurso da Polícia Federal"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => updateFormData('descricao', e.target.value)}
                placeholder="Descrição detalhada do concurso..."
                rows={3}
              />
            </div>

            {/* Ano */}
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => updateFormData('ano', Number(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>

            {/* Banca */}
            <div>
              <Label htmlFor="banca">Banca</Label>
              <Input
                id="banca"
                value={formData.banca}
                onChange={(e) => updateFormData('banca', e.target.value)}
                placeholder="Ex: CESPE/CEBRASPE"
              />
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoriaId}
                onValueChange={(value) => updateFormData('categoriaId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nível de Dificuldade */}
            <div>
              <Label htmlFor="dificuldade">Nível de Dificuldade</Label>
              <Select
                value={formData.nivel_dificuldade}
                onValueChange={(value: 'facil' | 'medio' | 'dificil') => 
                  updateFormData('nivel_dificuldade', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiplicador de Questões */}
            <div>
              <Label htmlFor="multiplicador">Multiplicador de Questões</Label>
              <Input
                id="multiplicador"
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={formData.multiplicador_questoes}
                onChange={(e) => updateFormData('multiplicador_questoes', Number(e.target.value))}
              />
            </div>

            {/* Botão de Submit */}
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando Concurso...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar Concurso
                </>
              )}
            </Button>

            {/* Exibir erro de criação */}
            {isErrorCreating && (
              <div className="flex items-center space-x-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errorCreating?.message}</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 