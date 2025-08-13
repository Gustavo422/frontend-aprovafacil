export function generateCorrelationId(prefix = 'rq-simulados'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}



