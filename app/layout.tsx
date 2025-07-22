import type React from 'react';
import { Inter } from 'next/font/google';
import { Providers } from '@/src/providers';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';
import { ConcursoProvider } from '@/contexts/ConcursoContext';
import { AuthProvider } from '@/features/auth/contexts/auth-context';
import './globals.css';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  titulo: 'AprovaFacil',
  descricao: 'Plataforma de estudos para concursos públicos',
  generator: 'aprovafacil',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const themeColor = [
  { media: '(prefers-color-scheme: light)', color: 'white' },
  { media: '(prefers-color-scheme: dark)', color: 'black' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Removido script de env-config.js, não é mais necessário */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Capturar erros de unhandledRejection
              window.addEventListener('unhandledrejection', function(event) {
                console.warn('Unhandled promise rejection:', event.reason);
                event.preventDefault();
              });

              // Capturar erros gerais
              window.addEventListener('error', function(event) {
                console.warn('Global error:', event.error);
                // Não prevenir o comportamento padrão para erros críticos
              });

              // Capturar erros de hidratação
              window.addEventListener('error', function(event) {
                if (event.message && event.message.includes('hydration')) {
                  console.warn('Hydration error detected:', event.message);
                  event.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body 
        className={`${inter.className} min-h-screen bg-background`} 
        suppressHydrationWarning={true}
        data-suppress-hydration-warning="true"
        data-extension-attributes="suppress"
      >
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
