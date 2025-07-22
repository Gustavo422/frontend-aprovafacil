import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard';

export const metadata = {
  title: 'Performance Monitoring | AprovaFácil',
  description: 'Monitoramento de performance do sistema AprovaFácil',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <PerformanceDashboard />
    </div>
  );
}