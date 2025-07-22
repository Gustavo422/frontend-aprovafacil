'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, TooltipItem } from 'chart.js';

Chart.register(...registerables);

interface CacheOperationsChartProps {
  operations: {
    get: number;
    set: number;
    delete: number;
    invalidate: number;
    clear: number;
  };
}

export function CacheOperationsChart({ operations }: CacheOperationsChartProps) {
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

    const labels = Object.keys(operations).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const data = Object.values(operations);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Operation Count',
            data,
            backgroundColor: [
              'rgba(54, 162, 235, 0.7)', // get - blue
              'rgba(75, 192, 192, 0.7)', // set - teal
              'rgba(255, 99, 132, 0.7)', // delete - red
              'rgba(255, 159, 64, 0.7)', // invalidate - orange
              'rgba(153, 102, 255, 0.7)', // clear - purple
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Operation Type'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: TooltipItem<'bar'>) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                return `${label}: ${value}`;
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
  }, [operations]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}