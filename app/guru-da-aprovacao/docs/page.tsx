import React from 'react';

export interface DocsPageProps {
  // Add actual props here
  content: string;
  metadata?: Record<string, unknown>;
}

export default function DocsPage({}: DocsPageProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Documentação da API (Swagger)</h1>
      {/*
      <button
        onClick={downloadOpenApiJson}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Baixar OpenAPI JSON
      </button>
      <div className="bg-white rounded shadow p-2">
        <SwaggerUI url="/api/docs/openapi.json" docExpansion="list" tryItOutEnabled={true} supportedSubmitMethods={["get", "post", "put", "delete", "patch"]} />
      </div>
      */}
    </div>
  );
}
