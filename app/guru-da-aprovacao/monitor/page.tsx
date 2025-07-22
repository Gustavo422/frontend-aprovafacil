'use client';

import React, { useEffect, useState } from 'react';

const API_BASE = '/api/monitor/tests';

interface TestHistory {
  created_at: string;
  file: string;
  test_name: string;
  status: string;
  duration?: number;
  output?: string;
  error?: string;
}

interface TestResult {
  [key: string]: unknown;
}

export default function MonitorTestesPage() {
  const [testFiles, setTestFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [testname, setTestname] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<TestHistory | null>(null);

  // Buscar arquivos de teste disponíveis (mock inicial)
  useEffect(() => {
    // TODO: Buscar do backend se houver endpoint, por enquanto mock
    setTestFiles([
      'src/api/monitor/tests/run/route.test.ts',
      'src/api/monitor/tests/example.test.ts',
      'src/features/auth/auth.service.test.ts',
    ]);
  }, []);

  // Buscar histórico de execuções
  useEffect(() => {
    fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.history || []));
  }, [result]);

  const handleRunTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ file: selectedFile, testname })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao executar teste');
      setResult(data.results);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Execução de Testes Individuais</h1>
      <div className="mb-4">
        <label className="block mb-1">Arquivo de Teste:</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={selectedFile}
          onChange={e => setSelectedFile(e.target.value)}
        >
          <option value="">Selecione um arquivo...</option>
          {testFiles.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Nome do Teste (opcional):</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={testname}
          onChange={e => setTestname(e.target.value)}
          placeholder="Ex: deve retornar sucesso"
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleRunTest}
        disabled={loading || !selectedFile}
      >
        {loading ? 'Executando...' : 'Executar Teste'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Resultado:</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Histórico de Execuções Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1">Data</th>
                <th className="px-2 py-1">Arquivo</th>
                <th className="px-2 py-1">Teste</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Duração</th>
                <th className="px-2 py-1">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className={h.status === 'failed' ? 'bg-red-100' : 'bg-green-100'}>
                  <td className="px-2 py-1">{new Date(h.created_at).toLocaleString()}</td>
                  <td className="px-2 py-1">{h.file}</td>
                  <td className="px-2 py-1">{h.test_name}</td>
                  <td className="px-2 py-1 font-bold">{h.status}</td>
                  <td className="px-2 py-1">{h.duration !== undefined ? h.duration.toFixed(2) + 's' : '-'}</td>
                  <td className="px-2 py-1">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      onClick={() => { setDetailsData(h); setShowDetails(true); }}
                    >Ver logs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showDetails && detailsData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowDetails(false)}
            >Fechar</button>
            <h3 className="text-lg font-bold mb-2">Detalhes da Execução</h3>
            <div className="mb-2"><b>Arquivo:</b> {detailsData.file}</div>
            <div className="mb-2"><b>Teste:</b> {detailsData.test_name}</div>
            <div className="mb-2"><b>Status:</b> {detailsData.status}</div>
            <div className="mb-2"><b>Duração:</b> {detailsData.duration !== undefined ? detailsData.duration.toFixed(2) + 's' : '-'}</div>
            <div className="mb-2"><b>Output:</b></div>
            <pre className="bg-gray-100 rounded p-2 text-xs max-h-40 overflow-auto whitespace-pre-wrap">{detailsData.output || '-'}</pre>
            {detailsData.error && (
              <>
                <div className="mb-2 mt-2"><b>Erros:</b></div>
                <pre className="bg-red-100 rounded p-2 text-xs max-h-32 overflow-auto whitespace-pre-wrap text-red-700">{detailsData.error}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
