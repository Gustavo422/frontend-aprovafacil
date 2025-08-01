'use client';

import React from 'react';
import { Button } from './button';
import { Download } from 'lucide-react';

interface ExportJsonButtonProps {
  data: unknown;
  filename?: string;
  children?: React.ReactNode;
}

export function ExportJsonButton({ 
  data, 
  filename = 'export.json', 
  children 
}: ExportJsonButtonProps) {
  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      {children || 'Export JSON'}
    </Button>
  );
}