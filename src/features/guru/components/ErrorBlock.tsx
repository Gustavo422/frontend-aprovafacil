import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBlockProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorBlock({ title = 'Ocorreu um erro', message = 'Tente novamente.', onRetry }: ErrorBlockProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 text-red-600">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}


