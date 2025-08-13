"use client";
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function FeatureError({ title = 'Ocorreu um erro', description = 'Tente novamente em instantes.', onRetry }: Props) {
  return (
    <div className="flex flex-col gap-3 items-center justify-center rounded-lg border p-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-600" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RotateCcw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}


