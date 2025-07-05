import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n';

// Configure the middleware for internationalization
export default createMiddleware({
  // List of all locales that are supported
  locales,
  
  // Default locale to use when none is specified
  defaultLocale,
  
  // Locale prefix behavior
  localePrefix: 'as-needed',
  
  // Configure pathnames for internationalized routing
  // https://next-intl-docs.vercel.app/docs/routing/internationalized-routing
  pathnames: {
    // Example of custom pathnames:
    // '/': '/',
    // '/about': {
    //   en: '/about',
    //   'pt-BR': '/sobre'
    // }
  },
  
  // Optional: Disable automatic locale detection
  // localeDetection: false,
  
  // Optional: Set the domain for each locale
  // domains: [
  //   {
  //     domain: 'example.com',
  //     defaultLocale: 'en',
  //   },
  //   {
  //     domain: 'example.pt',
  //     defaultLocale: 'pt-BR',
  //   },
  // ],
});

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    // Match all pathnames except for:
    // - api routes
    // - static files
    // - image optimization files
    // - favicon.ico
    // - public folder
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
