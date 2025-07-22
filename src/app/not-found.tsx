import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';
import type { JSX } from 'react';

/**
 * Next.js not found page component
 */
export default function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border border-blue-100">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <FileQuestion className="h-10 w-10 text-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">P�gina n�o encontrada</h1>
            <p className="text-gray-600">
              A p�gina que voc� est� procurando n�o existe ou foi movida.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                P�gina inicial
              </Link>
            </Button>
            
            <Button
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
