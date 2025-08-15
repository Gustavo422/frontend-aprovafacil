'use client';

import { CalendarIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface QuestoesSemanaisHeaderProps {
  concursoId: string;
}

export function QuestoesSemanaisHeader({ concursoId }: QuestoesSemanaisHeaderProps) {
  return (
    <div className="py-12">
      <div className="container-padding">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Questões Semanais
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Gerencie seu progresso e acompanhe suas conquistas semanais
          </p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-background hover:bg-muted/50 transition-colors group">
            <CardContent className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                <div className="text-primary">
                  <CalendarIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">50</div>
              <div className="text-muted-foreground">Semanas Totais</div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-background hover:bg-muted/50 transition-colors group">
            <CardContent className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                <div className="text-primary">
                  <ClockIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">7</div>
              <div className="text-muted-foreground">Dias por Semana</div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-background hover:bg-muted/50 transition-colors group">
            <CardContent className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                <div className="text-primary">
                  <TrophyIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-muted-foreground">Meta de Conclusão</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
