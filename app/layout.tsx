import type React from 'react';
import { Inter } from 'next/font/google';
import { Providers } from '@/src/providers';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
import { ConcursoProvider } from '@/contexts/ConcursoContext';
import { AuthProvider } from '@/providers/auth-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Concursos Study App',
  description: 'Plataforma de estudos para concursos públicos',
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`} suppressHydrationWarning>
        <Providers>
          <ErrorBoundaryWrapper>
            <AuthProvider>
              <ConcursoProvider>
                {children}
              </ConcursoProvider>
            </AuthProvider>
          </ErrorBoundaryWrapper>
        </Providers>
      </body>
    </html>
  );
}
