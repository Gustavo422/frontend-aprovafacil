"use client";
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function StaleDataBanner({ message = 'Você está vendo dados em cache. Pode haver atualizações disponíveis.', onRetry }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-700" />
        <span className="text-yellow-800">{message}</span>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="border-yellow-300 text-yellow-800">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Tentar atualizar
        </Button>
      )}
    </div>
  );
}


