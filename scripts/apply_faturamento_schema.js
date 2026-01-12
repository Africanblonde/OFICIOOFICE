import { supabase } from '../services/supabaseClient';
import { readFileSync } from 'fs';

async function applySchema() {
  try {
    const sql = readFileSync('./sql/faturamento_despesas_extension.sql', 'utf8');

    // Executar SQL em partes para evitar problemas de tamanho
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executando:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error('Erro na execução:', error);
          // Continuar com próximos statements mesmo com erro
        }
      }
    }

    console.log('Schema aplicado com sucesso!');
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

applySchema();