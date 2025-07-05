'use client';

import { Button } from '@/components/ui/button';
import { Download, FileJson } from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ExportJsonButtonProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  filename: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportJsonButton({
  data,
  filename,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = ''
}: ExportJsonButtonProps) {
  const { toast } = useToast();

  const exportToJson = () => {
    try {
      // Criar o objeto de dados para exportação
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          filename: filename,
          version: '1.0',
          source: 'Concentrify Admin System'
        },
        data: data
      };

      // Converter para JSON com formatação
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Criar blob e download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação realizada',
        description: `Arquivo ${filename} exportado com sucesso!`,
      });
    } catch (error) {
      logger.error('Erro ao exportar JSON:', { 
        error: error instanceof Error ? error.message : String(error)
      });
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados como JSON.',
      });
    }
  };

  return (
    <Button
      onClick={exportToJson}
      disabled={disabled}
      variant={variant}
      size={size}
      className={className}
    >
      <FileJson className="mr-2 h-4 w-4" />
      <Download className="mr-2 h-4 w-4" />
      Exportar JSON
    </Button>
  );
} 