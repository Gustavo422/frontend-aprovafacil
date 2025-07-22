'use client';

import { Alert, Alertdescricao, Alerttitulo } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface RateLimitInfoProps {
  isVisible?: boolean;
}

export function RateLimitInfo({ isVisible = false }: RateLimitInfoProps) {
  if (!isVisible) return null;

  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <Alerttitulo>Informação sobre Rate Limit</Alerttitulo>
      <Alertdescricao>
        O erro &quot;Request rate limit reached&quot; ocorre quando muitas
        tentativas de login são feitas em um curto período. Isso é uma medida de
        segurança do Supabase. Aguarde alguns minutos antes de tentar novamente.
      </Alertdescricao>
    </Alert>
  );
}
