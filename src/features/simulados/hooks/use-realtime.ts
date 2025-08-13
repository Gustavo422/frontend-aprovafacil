import { useEffect } from 'react';
import { getSupabase } from '@/src/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type Filter = { concurso_id?: string; simulado_id?: string; slug?: string };

export function useSimuladosRealtime(filter: Filter) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabase> | null = null;
    try {
      supabase = getSupabase();
    } catch {
      // Supabase não configurado: sair silenciosamente (sem realtime)
      return;
    }
    const channels: Array<ReturnType<typeof supabase.channel>> = [];

    // simulados por concurso ou slug
    if (filter.concurso_id || filter.slug) {
      const where = filter.concurso_id
        ? `concurso_id=eq.${filter.concurso_id}`
        : `slug=eq.${filter.slug}`;
      const ch = supabase.channel(`rt-simulados-${where}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'simulados', filter: where },
          () => {
            if (filter.concurso_id) {
              queryClient.invalidateQueries({ queryKey: ['simulados', 'list'] });
            }
            if (filter.slug) {
              queryClient.invalidateQueries({ queryKey: ['simulados', 'detail', filter.slug] });
            }
          },
        )
        .subscribe();
      channels.push(ch);
    }

    // questoes por simulado_id (quando disponível)
    if (filter.simulado_id) {
      const whereQ = `simulado_id=eq.${filter.simulado_id}`;
      const chQ = supabase.channel(`rt-questoes-${whereQ}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'questoes_simulado', filter: whereQ },
          () => {
            if (filter.slug) {
              queryClient.invalidateQueries({ queryKey: ['simulados', 'questoes', filter.slug] });
            }
          },
        )
        .subscribe();
      channels.push(chQ);
    }

    return () => {
      channels.forEach((c) => {
        try { void supabase.removeChannel(c); } catch { /* noop */ }
      });
    };
  }, [filter.concurso_id, filter.simulado_id, filter.slug, queryClient]);
}


