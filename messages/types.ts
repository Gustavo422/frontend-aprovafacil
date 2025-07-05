// Types for internationalization messages
export type Messages = typeof import('./en/common.json');

export type IntlMessages = {
  common: Messages;
  // Add other namespaces here as needed
  // e.g., auth: typeof import('./en/auth.json');
};
