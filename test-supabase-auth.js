// Script para testar autenticação do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbwgfwwokoanohkjvcie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id2dmd3dva29hbm9oa2p2Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTYzNDAsImV4cCI6MjA2ODA5MjM0MH0.q7-1E_dRBW46h0nVHOxlQcAx5lBe0dExl237ikadJPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('Testando autenticação do Supabase...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return;
    }
    
    if (user) {
      console.log('Usuário logado:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Sessão ativa:', {
          access_token: session.access_token ? 'Presente' : 'Ausente',
          expires_at: session.expires_at
        });
      } else {
        console.log('Nenhuma sessão ativa');
      }
    } else {
      console.log('Nenhum usuário logado');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

testAuth();