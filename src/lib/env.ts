// Centraliza e valida variáveis de ambiente críticas

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      `Faltam variáveis de ambiente do Supabase!\n` +
      `NEXT_PUBLIC_SUPABASE_URL: ${url}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key}\n` +
      `\nCorrija seu arquivo .env e reinicie o servidor.`
    );
  }
  return { url, key };
} 