'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface RateLimitInfoProps {
  isVisible?: boolean;
}

export function RateLimitInfo({ isVisible = false }: RateLimitInfoProps) {
  if (!isVisible) return null;

  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Informação sobre Rate Limit</AlertTitle>
      <AlertDescription>
        O erro &quot;Request rate limit reached&quot; ocorre quando muitas
        tentativas de login são feitas em um curto período. Isso é uma medida de
        segurança do Supabase. Aguarde alguns minutos antes de tentar novamente.
      </AlertDescription>
    </Alert>
  );
}
