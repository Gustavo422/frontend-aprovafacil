'use client';

import React, { useState } from 'react';
import { useCriarSimulado } from '@/src/features/simulados/hooks/use-simulados';
import { useListarConcursos } from '@/src/features/concursos/hooks/use-concursos';
import { useToast } from '@/features/shared/hooks/use-toast';
import { Card, CardContent, CardHeader, Cardtitulo } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SimuladoFormData {
  titulo: string;
  descricao: string;
  questions_count: number;
  time_minutes: number;
  dificuldade: string;
  concurso_id: string;
  is_public: boolean;
  created_by: string | null;
}

export function SimuladoFormExample() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SimuladoFormData>({
    titulo: '',
    descricao: '',
    questions_count: 20,
    time_minutes: 60,
    dificuldade: 'Médio',
    concurso_id: '',
    is_public: true,
    created_by: null,
  });

  // Buscar concursos para o select
  const {
    data: concursos = [],
    isLoading: loadingConcursos,
    isError: isErrorConcursos,
    error: errorConcursos,
  } = useListarConcursos({ ativo: true });

  // Mutation para criar simulado
  const {
    mutate: criarSimulado,
    isPending: isCreating,
    isError: isErrorCreating,
    error: errorCreating,
  } = useCriarSimulado();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.concurso_id) {
      toast({
        title: 'Dados incompletos',
        descricao: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    criarSimulado(formData, {
      onSuccess: () => {
        toast({
          title: 'Simulado criado!',
          descricao: 'O simulado foi criado com sucesso.',
        });
        // Limpar formulário
        setFormData({
          titulo: '',
          descricao: '',
          questions_count: 20,
          time_minutes: 60,
          dificuldade: 'Médio',
          concurso_id: '',
          is_public: true,
          created_by: null,
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao criar simulado',
          descricao: error.message || 'Não foi possível criar o simulado.',
          variant: 'destructive',
        });
      },
    });
  };

  const updateFormData = (field: keyof SimuladoFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingConcursos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando concursos...</p>
      </div>
    );
  }

  if (isErrorConcursos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-500 mb-2">Erro ao carregar concursos</p>
        <p className="text-sm text-muted-foreground">{errorConcursos?.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <Cardtitulo className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Criar Novo Simulado</span>
          </Cardtitulo>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <Label htmlFor="titulo">Título do Simulado *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => updateFormData('titulo', e.target.value)}
                placeholder="Ex: Simulado Polícia Federal - Conhecimentos Básicos"
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
                placeholder="Descrição detalhada do simulado..."
                rows={3}
              />
            </div>

            {/* Número de Questões */}
            <div>
              <Label htmlFor="questions_count">Número de Questões</Label>
              <Input
                id="questions_count"
                type="number"
                value={formData.questions_count}
                onChange={(e) => updateFormData('questions_count', Number(e.target.value))}
                min={1}
                max={200}
              />
            </div>

            {/* Tempo em Minutos */}
            <div>
              <Label htmlFor="time_minutes">Tempo em Minutos</Label>
              <Input
                id="time_minutes"
                type="number"
                value={formData.time_minutes}
                onChange={(e) => updateFormData('time_minutes', Number(e.target.value))}
                min={15}
                max={480}
                step={15}
              />
            </div>

            {/* Dificuldade */}
            <div>
              <Label htmlFor="dificuldade">Dificuldade</Label>
              <Select
                value={formData.dificuldade}
                onValueChange={(value) => updateFormData('dificuldade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Concurso */}
            <div>
              <Label htmlFor="concurso">Concurso *</Label>
              <Select
                value={formData.concurso_id}
                onValueChange={(value) => updateFormData('concurso_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um concurso" />
                </SelectTrigger>
                <SelectContent>
                  {concursos.map(concurso => (
                    <SelectItem key={concurso.id} value={concurso.id}>
                      {concurso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Público */}
            <div>
              <Label htmlFor="is_public">Visibilidade</Label>
              <Select
                value={formData.is_public ? 'true' : 'false'}
                onValueChange={(value) => updateFormData('is_public', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Público</SelectItem>
                  <SelectItem value="false">Privado</SelectItem>
                </SelectContent>
              </Select>
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
                  Criando Simulado...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar Simulado
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