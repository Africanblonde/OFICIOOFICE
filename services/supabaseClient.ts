import { createClient } from '@supabase/supabase-js';

// Configuração usando variáveis de ambiente do Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Cliente único para uso em toda a aplicação
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Exemplo de função para buscar dados via Supabase
 * Pode substituir as chamadas mockadas no LogisticsContext
 */
export const fetchInventory = async (locationId?: string) => {
    let query = supabase.from('inventory').select('*, items(*)');
    if (locationId) {
        query = query.eq('location_id', locationId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
};
