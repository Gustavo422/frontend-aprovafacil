'use client';

import { ExportJsonButton } from '@/components/ui/export-json-button'; // Used in return statement

interface ExportDashboardButtonProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  filename: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function ExportDashboardButton({
  data,
  filename,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: ExportDashboardButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <ExportJsonButton
        data={data}
        filename={filename}
        disabled={disabled}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      />
    </div>
  );
}
