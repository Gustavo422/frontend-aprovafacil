import { Suspense } from 'react';
import { QuestoesSemanaisPage } from '@/features/questoes-semanais/components/questoes-semanais-page';
import { QuestoesSemanaisSkeleton } from '@/features/questoes-semanais/components/questoes-semanais-skeleton';

export const metadata = {
  title: 'Questões Semanais | AprovaFácil',
  description: 'Gerencie suas questões semanais e acompanhe seu progresso no concurso',
};

export default function QuestoesSemanaisPageWrapper() {
  return (
    <Suspense fallback={<QuestoesSemanaisSkeleton />}>
      <QuestoesSemanaisPage />
    </Suspense>
  );
}
