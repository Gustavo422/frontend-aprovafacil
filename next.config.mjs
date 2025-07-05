/** @type {import('next').NextConfig} */


// Configuração para o Next.js
const nextConfig = {
  // A configuração de loaders dentro de `turbopack` não é uma opção válida no Next.js 14+.
  // A configuração de SVGs deve ser feita de outra forma se necessário.
  // Removendo a chave `turbopack` por enquanto para limpar o aviso.
  // turbopack: {},

  
  // Configuração do webpack (usado apenas em desenvolvimento sem Turbopack)
  webpack: (config, { isServer: _isServer }) => {
    // Adicione configurações específicas do webpack aqui
    return config;
  },
  
  // Configuração de imagens
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Cabeçalhos de segurança
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  
  // Configuração do TypeScript
  typescript: {
    // Ignorar erros de tipo durante o build
    ignoreBuildErrors: false,
  },
  
  // Configuração do ESLint
  eslint: {
    // Não permitir builds com erros de ESLint
    ignoreDuringBuilds: false,
  },
  
  // Ativar Strict Mode do React
  reactStrictMode: true,
  
  // Extensões de página
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  
  // Variáveis de ambiente
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  
  // Desativar source maps no navegador em produção
  productionBrowserSourceMaps: false,
  
  // Desativar o cabeçalho 'X-Powered-By'
  poweredByHeader: false,
};

// Bundle analyzer configuration
export default nextConfig;
