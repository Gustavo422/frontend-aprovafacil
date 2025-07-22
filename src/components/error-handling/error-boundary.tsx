'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorHandler } from '@/src/lib/errors';
import { ErrorFallback } from './error-fallback';

interface ErrorBoundaryProps {
  /**
   * Children to render
   */
  children: ReactNode;
  
  /**
   * Custom fallback component to render when an error occurs
   */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  
  /**
   * Whether to log errors to the console
   * @default true
   */
  logErrors?: boolean;
  
  /**
   * Callback to execute when an error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /**
   * Whether to reset the error state when the component updates
   * @default false
   */
  resetOnUpdate?: boolean;
  
  /**
   * Whether to reset the error state when the component unmounts
   * @default true
   */
  resetOnUnmount?: boolean;
}

interface ErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * The error that occurred
   */
  error: Error | null;
}

/**
 * Component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  /**
   * Log the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    if (this.props.logErrors !== false) {
      getErrorHandler().logError(error, { componentStack: errorInfo.componentStack });
    }
    
    // Execute callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Reset the error state
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };
  
  /**
   * Reset the error state when the component updates if resetOnUpdate is true
   */
  componentDidUpdate(): void {
    if (this.props.resetOnUpdate && this.state.hasError) {
      this.resetError();
    }
  }
  
  /**
   * Reset the error state when the component unmounts if resetOnUnmount is true
   */
  componentWillUnmount(): void {
    if (this.props.resetOnUnmount !== false && this.state.hasError) {
      this.resetError();
    }
  }
  
  render(): ReactNode {
    // If there's no error, render children
    if (!this.state.hasError) {
      return this.props.children;
    }
    
    // If there's an error, render fallback
    if (this.props.fallback) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.resetError);
      }
      return this.props.fallback;
    }
    
    // If no fallback is provided, render default fallback
    return <ErrorFallback error={this.state.error!} resetError={this.resetError} />;
  }
}
