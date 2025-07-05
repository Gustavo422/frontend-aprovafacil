import { getRequestConfig, type RequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { IntlError } from 'next-intl';

// Define the locales your application supports
export const locales = ['en', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'pt-BR';

// Type for our translation files
type Messages = Record<string, string>;

// Validate that the incoming `locale` parameter is valid
export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

// Get the messages for the active locale
export default getRequestConfig(async ({ locale: localeParam }): Promise<RequestConfig> => {
  // Ensure we have a valid locale
  const locale = localeParam || defaultLocale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) notFound();

  try {
    // Dynamically import the messages for the active locale
    const messages = (await import(`@/messages/${locale || defaultLocale}/common.json`)).default as Record<string, string>;

    return {
      locale: locale || defaultLocale,
      messages: {
        common: messages,
      },
      onError: (error: IntlError) => {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('i18n error:', error);
        }
      },
    } as RequestConfig;
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`Failed to load messages for locale: ${locale}`, error);
    }
    notFound();
  }
});

// Extend the IntlMessages interface with our message types
declare module 'next-intl' {
  // Extend the interface with our message structure
  export interface IntlMessages {
    common: Messages;
  }
}
