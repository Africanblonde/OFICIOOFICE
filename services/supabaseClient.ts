import { createClient } from '@supabase/supabase-js';

// Configuração usando variáveis de ambiente do Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kwnbyiqzrphkembkwyvd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bmJ5aXF6cnBoa2VtYmt3eXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjcyNDYsImV4cCI6MjA3OTY0MzI0Nn0.EZOCsrZoudDfjQrWS0OmNgj-MPCO2X1_8mhiiWevS_g';

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
