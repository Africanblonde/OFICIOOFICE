-- ⚠️ AVISO: SCRIPT DE RESET TOTAL DEFINITIVO (DANGER ZONE) ⚠️
-- Este script apaga definitiva e permanentemente CADA DADO da aplicação.

-- 1. Limpeza Automática do Esquema Público
-- Este bloco deteta e limpa absolutamente TODAS as tabelas criadas no sistema,
-- evitando qualquer erro de Chaves Estrangeiras (Foreign Keys) esquecidas!
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- 2. DESTRUIR CONTAS DE LOGIN
-- Uma vez que todas as dependências públicas estão limpas pelo bloco acima,
-- a tabela vital do Supabase pode ser limpa livremente, desligando as sessões.
DELETE FROM auth.users;

-- ==========================================================
-- SUCESSO! A tua base de dados está agora virgem e limpa.
-- Próximo Passo: Volta à página de Registo no teu Portal (ex: localhost:3000/register) ou UI de Admin 
-- e cria o primeiro utilizador, que será o teu novo Admin-Geral.
-- ==========================================================
