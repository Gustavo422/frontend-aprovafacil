// Fixes para compatibilidade com React 19
declare module 'cmdk' {
  import * as React from 'react';
  
  export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    children?: React.ReactNode;
  }
  
  export interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    heading?: React.ReactNode;
  }
  
  export interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
  }
  
  export const Command: React.ForwardRefExoticComponent<CommandProps & React.RefAttributes<HTMLDivElement>> & {
    Input: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLInputElement>>;
    List: React.ForwardRefExoticComponent<CommandListProps & React.RefAttributes<HTMLDivElement>>;
    Empty: React.ForwardRefExoticComponent<CommandEmptyProps & React.RefAttributes<HTMLDivElement>>;
    Group: React.ForwardRefExoticComponent<CommandGroupProps & React.RefAttributes<HTMLDivElement>>;
    Separator: React.ForwardRefExoticComponent<CommandSeparatorProps & React.RefAttributes<HTMLDivElement>>;
    Item: React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLDivElement>>;
  };
}

declare module 'input-otp' {
  import * as React from 'react';
  
  export interface OTPInputProps {
    value?: string;
    onChange?: (value: string) => void;
    maxLength: number;
    textAlign?: 'center' | 'left' | 'right';
    onComplete?: (...args: unknown[]) => void;
    pushPasswordManagerStrategy?: 'none' | 'auto' | 'manual';
    pasteTransformer?: (pasted: string) => string;
    containerClassName?: string;
    className?: string;
  }
  
  export const OTPInput: React.ForwardRefExoticComponent<OTPInputProps & React.RefAttributes<HTMLInputElement>>;
  export const OTPInputContext: React.Context<Record<string, unknown>>;
}

declare module 'react-resizable-panels' {
  import * as React from 'react';
  
  export interface PanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    direction: 'horizontal' | 'vertical';
    children?: React.ReactNode;
  }
  
  export interface PanelResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    withHandle?: boolean;
  }
  
  export const PanelGroup: React.ForwardRefExoticComponent<PanelGroupProps & React.RefAttributes<HTMLDivElement>>;
  export const PanelResizeHandle: React.ForwardRefExoticComponent<PanelResizeHandleProps & React.RefAttributes<HTMLDivElement>>;
}

declare module 'sonner' {
  import * as React from 'react';
  
  export interface ToasterProps {
    theme?: 'light' | 'dark' | 'system';
    children?: React.ReactNode;
  }
  
  export const Toaster: React.ForwardRefExoticComponent<ToasterProps & React.RefAttributes<HTMLElement>>;
  export const toast: Record<string, unknown>;
} 