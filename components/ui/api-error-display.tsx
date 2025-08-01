'use client';

import React from 'react';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle } from 'lucide-react';

interface ApiErrorDisplayProps {
  error: Error | string | null;
  className?: string;
}

export function ApiErrorDisplay({ error, className }: ApiErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {errorMessage}
      </AlertDescription>
    </Alert>
  );
}