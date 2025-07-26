'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card, CardContent, CardHeader, Cardtitulo, Carddescricao } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/features/shared/hooks/use-toast';
import { Loader2, GraduationCap, Clock, Target, BookOpen } from 'lucide-react';
import { useListarConcursos } from '@/src/features/concursos/hooks/use-concursos';

interface OnboardingData {
  concurso_id: string;
  horas_disponiveis: number;
  tempo_falta_concurso: string;
  nivel_preparacao: string;
  niveis_materias: Record<string, string>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Remover estado local de concursos
  // const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [formData, setFormData] = useState<OnboardingData>({
    concurso_id: '',
    horas_disponiveis: 2,
    tempo_falta_concurso: '',
    nivel_preparacao: '',
    niveis_materias: {}
  });

  // Buscar concursos com React Query
  const {
    data: concursos = [],
    isLoading: loadingConcursos,
    isError: isErrorConcursos,
    refetch: refetchConcursos
  } = useListarConcursos();

  // Verificar se usuário está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Remover useEffect de fetch manual de concursos

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
        <p className="text-red-500 mb-2">Erro ao carregar concursos.</p>
        <Button onClick={() => refetchConcursos()}>Tentar novamente</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.concurso_id || !formData.tempo_falta_concurso || !formData.nivel_preparacao) {
      toast({
        title: 'Dados incompletos',
        descricao: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Onboarding concluído!',
          descricao: 'Seu perfil foi configurado com sucesso.',
        });
        
        // Redirecionar para o dashboard
        router.push('/');
      } else {
        throw new Error(data.error?.message || 'Erro ao salvar onboarding');
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        descricao: error instanceof Error ? error.message : 'Erro ao salvar suas respostas.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: string | number | Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <Cardtitulo className="text-2xl font-bold">
                Bem-vindo ao AprovaFácil!
              </Cardtitulo>
              <Carddescricao>
                Vamos configurar seu perfil para personalizar sua experiência de estudos
              </Carddescricao>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Concurso */}
              <div className="space-y-2">
                <Label htmlFor="concurso" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Qual concurso você está estudando?
                </Label>
                <Select 
                  value={formData.concurso_id} 
                  onValueChange={(value) => updateFormData('concurso_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um concurso" />
                  </SelectTrigger>
                  <SelectContent>
                    {concursos.map((concurso) => (
                      <SelectItem key={concurso.id} value={concurso.id}>
                        {concurso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
        </div>

              {/* Horas disponíveis */}
              <div className="space-y-2">
                <Label htmlFor="horas" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quantas horas por dia você pode estudar?
                </Label>
                <Input
                  id="horas"
            type="number"
                  min="1"
                  max="24"
                  value={formData.horas_disponiveis}
                  onChange={(e) => updateFormData('horas_disponiveis', parseInt(e.target.value))}
                  className="w-32"
          />
        </div>

              {/* Tempo até o concurso */}
              <div className="space-y-2">
                <Label htmlFor="tempo" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Quanto tempo falta para o concurso?
                </Label>
                <Input
                  id="tempo"
                  placeholder="Ex: 6 meses, 1 ano, 2 anos"
                  value={formData.tempo_falta_concurso}
                  onChange={(e) => updateFormData('tempo_falta_concurso', e.target.value)}
          />
        </div>

              {/* Nível de preparação */}
              <div className="space-y-2">
                <Label htmlFor="preparacao" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Como você se sente em relação à sua preparação?
                </Label>
                <Select 
                  value={formData.nivel_preparacao} 
                  onValueChange={(value) => updateFormData('nivel_preparacao', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante - Começando do zero</SelectItem>
                    <SelectItem value="basico">Básico - Conheço alguns tópicos</SelectItem>
                    <SelectItem value="intermediario">Intermediário - Tenho uma boa base</SelectItem>
                    <SelectItem value="avancado">Avançado - Estou bem preparado</SelectItem>
                    <SelectItem value="expert">Expert - Domino o conteúdo</SelectItem>
                  </SelectContent>
                </Select>
        </div>

              {/* Observações adicionais */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">
                  Observações adicionais (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Conte-nos mais sobre seus objetivos, dificuldades específicas, etc."
                  rows={3}
          />
        </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  'Finalizar Configuração'
                )}
        </Button>
      </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 