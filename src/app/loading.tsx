import * as React from 'react';
import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';

/**
 * Next.js loading page component
 */
export default function LoadingPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
