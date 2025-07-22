'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, TooltipItem } from 'chart.js';

Chart.register(...registerables);

interface CacheMetricsChartProps {
  hitRate: number;
  missRate: number;
}

export function CacheMetricsChart({ hitRate, missRate }: CacheMetricsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hit', 'Miss'],
        datasets: [
          {
            data: [hitRate * 100, missRate * 100],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: ['#10b981', '#ef4444'],
            borderWidth: 1,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context: TooltipItem<'line'>) {
                const label = context.label || '';
                const value = context.raw as number;
                return `${label}: ${value.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hitRate, missRate]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}