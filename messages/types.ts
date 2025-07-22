// Types for internationalization messages
export type Messages = typeof import('./en/common.json');

export type IntlMessages = {
  common: Messages;
  // Add other nomespaces here as needed
  // e.g., auth: typeof import('./en/auth.json');
};



