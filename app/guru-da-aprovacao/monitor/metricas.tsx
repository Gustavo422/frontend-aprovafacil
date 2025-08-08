import React, { useEffect, useState } from 'react';

interface Metrica {
  id: number;
  type: string;
  value: number;
  unit?: string;
  details?: string;
  collected_at: string;
}

export default function MetricasCustomizadas() {
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/monitor/metrics/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => res.json())
      .then(data => {
        if (data.success) setMetricas(data.history || []);
        else setError(data.error || 'Erro ao buscar métricas');
      })
      .catch(() => setError('Erro ao buscar métricas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando métricas...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  // Agrupar por tipo para cards
  const agrupadas = metricas.reduce<Record<string, Metrica[]>>((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Métricas Customizadas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {Object.entries(agrupadas).map(([tipo, lista]) => (
          <div key={tipo} className="bg-white rounded shadow p-4">
            <div className="font-semibold text-lg mb-2">{tipo}</div>
            <div className="text-3xl font-bold">{lista[0].value} {lista[0].unit || ''}</div>
            <div className="text-xs text-gray-500">Última atualização: {new Date(lista[0].collected_at).toLocaleString()}</div>
            {lista[0].details && <div className="text-xs mt-2">{lista[0].details}</div>}
          </div>
        ))}
      </div>
      <h2 className="font-semibold mb-2">Histórico Recente</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Data</th>
              <th className="px-2 py-1">Tipo</th>
              <th className="px-2 py-1">Valor</th>
              <th className="px-2 py-1">Unidade</th>
              <th className="px-2 py-1">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((m, i) => (
              <tr key={i}>
                <td className="px-2 py-1">{new Date(m.collected_at).toLocaleString()}</td>
                <td className="px-2 py-1">{m.type}</td>
                <td className="px-2 py-1 font-bold">{m.value}</td>
                <td className="px-2 py-1">{m.unit || '-'}</td>
                <td className="px-2 py-1">{m.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 



