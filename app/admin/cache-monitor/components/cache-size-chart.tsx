'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, TooltipItem } from 'chart.js';

Chart.register(...registerables);

interface CacheSizeChartProps {
  cacheSize: number;
  entryCount: number;
}

export function CacheSizeChart({ cacheSize, entryCount }: CacheSizeChartProps) {
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

    // For demo purposes, create a time series of the last 24 hours
    const labels = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date().getHours() - 23 + i;
      return `${hour < 0 ? 24 + hour : hour}:00`;
    });

    // Generate some mock data for the chart
    // In a real implementation, this would come from the API
    const generateMockData = () => {
      const baseSize = cacheSize * 0.7; // Start at 70% of current size
      const baseEntries = entryCount * 0.7;
      
      return {
        sizes: Array.from({ length: 24 }, (_, i) => {
          // Create a somewhat realistic growth pattern
          const growthFactor = 1 + (i / 24) * 0.3 + Math.random() * 0.05;
          return baseSize * growthFactor;
        }),
        entries: Array.from({ length: 24 }, (_, i) => {
          // Create a somewhat realistic growth pattern
          const growthFactor = 1 + (i / 24) * 0.3 + Math.random() * 0.05;
          return Math.round(baseEntries * growthFactor);
        })
      };
    };

    const mockData = generateMockData();

    // Format bytes for display
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cache Size',
            data: mockData.sizes,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            yAxisID: 'y',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Entry Count',
            data: mockData.entries,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            yAxisID: 'y1',
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Size'
            },
            ticks: {
              callback: function(value: string | number) {
                return formatBytes(Number(value));
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Entries'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context: TooltipItem<'bar'>) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                if (label === 'Cache Size') {
                  return `${label}: ${formatBytes(value)}`;
                }
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
  }, [cacheSize, entryCount]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}