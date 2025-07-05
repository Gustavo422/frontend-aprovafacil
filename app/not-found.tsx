'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <FileX className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Página não encontrada</CardTitle>
          <CardDescription className="text-sm">
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Verifique se o endereço está correto ou navegue usando os links
              abaixo.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Página Anterior
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Se você acredita que isso é um erro, entre em contato com nosso
            suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

