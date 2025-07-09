'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  metadata?: Record<string, unknown>;
}

const LEVELS = ['info', 'warn', 'error', 'debug'];

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<LogEntry[]>([]);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let url = '/api/dashboard/logs?limit=100';
    if (level) url += `&level=${level}`;
    if (service) url += `&service=${service}`;
    const res = await fetch(url);
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  };

  const startRealtime = () => {
    if (eventSource) return;
    setRealtimeActive(true);
    const es = new window.EventSource('/api/dashboard/logs/stream');
    es.onmessage = (event) => {
      const log: LogEntry = JSON.parse(event.data);
      setRealtimeLogs((prev) => [...prev.slice(-99), log]);
    };
    es.onerror = () => {
      es.close();
      setRealtimeActive(false);
      setEventSource(null);
    };
    setEventSource(es);
  };

  const stopRealtime = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setRealtimeActive(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [level, service]);

  useEffect(() => {
    return () => {
      if (eventSource) eventSource.close();
    };
    // eslint-disable-next-line
  }, []);

  const handleExport = (format: string) => {
    let url = `/api/dashboard/logs/export?format=${format}`;
    if (level) url += `&level=${level}`;
    if (service) url += `&service=${service}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Logs do Sistema</h1>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nível:</label>
          <select
            className="border rounded px-2 py-1"
            value={level}
            onChange={e => setLevel(e.target.value)}
          >
            <option value="">Todos</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Serviço:</label>
          <input
            className="border rounded px-2 py-1"
            value={service}
            onChange={e => setService(e.target.value)}
            placeholder="backend, api, database..."
          />
        </div>
        <div className="flex items-end gap-2">
          {user?.role === 'admin' ? (
            <>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleExport('json')}
              >Exportar JSON</button>
              <button
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => handleExport('csv')}
              >Exportar CSV</button>
              <button
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={() => handleExport('txt')}
              >Exportar TXT</button>
            </>
          ) : (
            <>
              <button
                className="px-3 py-2 bg-blue-300 text-white rounded cursor-not-allowed"
                disabled
                title="Apenas administradores podem exportar logs"
              >Exportar JSON</button>
              <button
                className="px-3 py-2 bg-green-300 text-white rounded cursor-not-allowed"
                disabled
                title="Apenas administradores podem exportar logs"
              >Exportar CSV</button>
              <button
                className="px-3 py-2 bg-gray-300 text-white rounded cursor-not-allowed"
                disabled
                title="Apenas administradores podem exportar logs"
              >Exportar TXT</button>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow p-2">
        {loading ? (
          <div className="p-4 text-center">Carregando logs...</div>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1">Data/Hora</th>
                <th className="px-2 py-1">Nível</th>
                <th className="px-2 py-1">Serviço</th>
                <th className="px-2 py-1">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className={log.level === 'error' ? 'bg-red-100' : log.level === 'warn' ? 'bg-yellow-100' : ''}>
                  <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-2 py-1 font-bold uppercase">{log.level}</td>
                  <td className="px-2 py-1">{log.service}</td>
                  <td className="px-2 py-1 break-all">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Logs em Tempo Real</h2>
          {realtimeActive ? (
            <button className="px-2 py-1 bg-red-600 text-white rounded text-xs" onClick={stopRealtime}>Parar</button>
          ) : (
            <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={startRealtime}>Iniciar</button>
          )}
        </div>
        <div className="overflow-y-auto bg-gray-900 text-white rounded shadow p-2 h-64 text-xs" style={{maxHeight: '16rem'}}>
          {realtimeLogs.length === 0 ? (
            <div className="text-center text-gray-400">Nenhum log em tempo real recebido ainda.</div>
          ) : (
            realtimeLogs.map((log, i) => (
              <div key={i} className={
                log.level === 'error' ? 'text-red-400' :
                log.level === 'warn' ? 'text-yellow-300' :
                'text-white'
              }>
                [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level.toUpperCase()}] [{log.service}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}