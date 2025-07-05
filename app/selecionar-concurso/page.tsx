import { ConcursoSelector } from '@/components/onboarding/ConcursoSelector';
import { ConcursoProvider } from '@/contexts/ConcursoContext';

export default function SelecionarConcursoPage() {
  return (
    <ConcursoProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ConcursoSelector />
        </div>
      </div>
    </ConcursoProvider>
  );
} 