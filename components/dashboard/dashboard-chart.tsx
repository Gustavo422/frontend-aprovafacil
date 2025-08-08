'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardChartProps {
  titulo: string;
  data: Array<Record<string, unknown>>;
  dataKey: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  children?: React.ReactNode;
}

// Memoized tooltip style to prevent recreation on each render
const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))',
  borderColor: 'hsl(var(--border))',
  borderRadius: 'var(--radius)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

// Memoized chart margins to prevent recreation on each render
const chartMargins = {
  top: 5,
  right: 10,
  left: 0,
  bottom: 5,
};

export const DashboardChart = memo(({
  titulo,
  data,
  dataKey,
  className,
  height = 300,
  showGrid = true,
  showLegend = false,
  children,
}: DashboardChartProps) => {
  // Memoize the data to prevent unnecessary re-renders
  // Only re-create when the data reference changes
  const memoizedData = useMemo(() => data, [data]);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={memoizedData}
              margin={chartMargins}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={dataKey} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {children}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
