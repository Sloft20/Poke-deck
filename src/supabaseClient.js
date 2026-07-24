import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env em vez de process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as chaves não forem encontradas, o app avisa no console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas!');
}

// Cria e exporta a conexão ativa para usarmos no resto do app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);