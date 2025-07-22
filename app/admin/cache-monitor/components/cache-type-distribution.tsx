'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { CacheType } from '@/lib/cache-manager';

Chart.register(...registerables);

interface CacheTypeStatistics {
  cacheType: CacheType;
  counts: {
    active: number;
    expired: number;
    total: number;
  };
  size?: number;
  largestEntries?: Array<{
    key: string;
    size: number;
  }>;
}

interface CacheTypeDistributionProps {
  distribution: Record<CacheType, CacheTypeStatistics>;
}

export function CacheTypeDistribution({ distribution }: CacheTypeDistributionProps) {
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

    const cacheTypes = Object.keys(distribution);
    if (cacheTypes.length === 0) return;

    const labels = cacheTypes.map(type => {
      switch (type) {
        case CacheType.MEMORY:
          return 'Memory';
        case CacheType.LOCAL_STORAGE:
          return 'Local Storage';
        case CacheType.SESSION_STORAGE:
          return 'Session Storage';
        case CacheType.SUPABASE:
          return 'Supabase';
        default:
          return type;
      }
    });

    const activeCounts = cacheTypes.map(type => distribution[type as CacheType].counts.active);
    const expiredCounts = cacheTypes.map(type => distribution[type as CacheType].counts.expired);
    const sizes = cacheTypes.map(type => distribution[type as CacheType].size || 0);

    // Format bytes for display
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Entries',
            data: activeCounts,
            backgroundColor: 'rgba(16, 185, 129, 0.7)', // green
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            stack: 'Stack 0',
          },
          {
            label: 'Expired Entries',
            data: expiredCounts,
            backgroundColor: 'rgba(239, 68, 68, 0.7)', // red
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            stack: 'Stack 0',
          },
          {
            label: 'Size',
            data: sizes,
            backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            yAxisID: 'y1',
            type: 'line',
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Cache Type'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Entry Count'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Size'
            },
            ticks: {
              callback: function(value: string | number) {
                return formatBytes(Number(value));
              }
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context: TooltipItem<'doughnut'>) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                if (label === 'Size') {
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
  }, [distribution]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}