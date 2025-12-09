-- ================================================================
-- SCRIPT DE DIAGNÓSTICO DE INTEGRIDADE DE CHAVES ESTRANGEIRAS (FOREIGN KEY)
-- ================================================================
-- Este script ajuda a encontrar "dados órfãos" na sua base de dados.
-- Dados órfãos são registros que fazem referência a outros registros que não existem mais.
-- Isso geralmente causa erros inesperados (como o erro 500) na aplicação.
--
-- Execute cada um dos SELECTs abaixo no seu editor de SQL do Supabase.
-- Se um SELECT retornar alguma linha, significa que você tem um problema de integridade
-- de dados que precisa ser corrigido.
-- ================================================================

-- ----------------------------------------------------------------
-- CHECK 1: Usuários com 'location_id' inválido
-- ----------------------------------------------------------------
-- Descrição: Procura por usuários que estão associados a uma localização que não existe mais.
-- Ação se encontrar: Anote o 'user_id' e o 'invalid_location_id'. Você precisará
-- atualizar o usuário para um 'location_id' válido ou para NULL.
-- Exemplo de correção: UPDATE public.users SET location_id = NULL WHERE id = 'user_id_encontrado';

SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.location_id AS invalid_location_id
FROM
    public.users u
LEFT JOIN
    public.locations l ON u.location_id = l.id
WHERE
    u.location_id IS NOT NULL
    AND l.id IS NULL;


-- ----------------------------------------------------------------
-- CHECK 2: Requisições com referências inválidas
-- ----------------------------------------------------------------
-- Descrição: Procura por requisições que apontam para usuários, itens ou localizações que não existem.
-- Ação se encontrar: Anote os IDs da requisição e os IDs inválidos.
-- Geralmente, a melhor solução é apagar estas requisições órfãs se não forem importantes.
-- Exemplo de correção: DELETE FROM public.requisitions WHERE id = 'requisition_id_encontrada';

SELECT
    r.id AS requisition_id,
    CASE WHEN u.id IS NULL THEN r.requester_id ELSE NULL END AS invalid_requester_id,
    CASE WHEN i.id IS NULL THEN r.item_id ELSE NULL END AS invalid_item_id,
    CASE WHEN sl.id IS NULL THEN r.source_location_id ELSE NULL END AS invalid_source_location_id,
    CASE WHEN tl.id IS NULL THEN r.target_location_id ELSE NULL END AS invalid_target_location_id
FROM
    public.requisitions r
LEFT JOIN
    public.users u ON r.requester_id = u.id
LEFT JOIN
    public.items i ON r.item_id = i.id
LEFT JOIN
    public.locations sl ON r.source_location_id = sl.id
LEFT JOIN
    public.locations tl ON r.target_location_id = tl.id
WHERE
    u.id IS NULL
    OR i.id IS NULL
    OR sl.id IS NULL
    OR tl.id IS NULL;


-- ----------------------------------------------------------------
-- CHECK 3: Registros de inventário com referências inválidas
-- ----------------------------------------------------------------
-- Descrição: Procura por registros de inventário que apontam para itens ou localizações que não existem.
-- Ação se encontrar: Apague estes registros de inventário órfãos.
-- Exemplo de correção: DELETE FROM public.inventory WHERE item_id = 'id_do_item_invalido';

SELECT
    inv.id as inventory_record_id,
    CASE WHEN i.id IS NULL THEN inv.item_id ELSE NULL END AS invalid_item_id,
    CASE WHEN l.id IS NULL THEN inv.location_id ELSE NULL END AS invalid_location_id
FROM
    public.inventory inv
LEFT JOIN
    public.items i ON inv.item_id = i.id
LEFT JOIN
    public.locations l ON inv.location_id = l.id
WHERE
    i.id IS NULL
    OR l.id IS NULL;


-- ----------------------------------------------------------------
-- CHECK 4: Registros de desempenho diário com 'worker_id' inválido
-- ----------------------------------------------------------------
-- Descrição: Procura por registros de desempenho associados a trabalhadores que não existem mais.
-- Ação se encontrar: Apague estes registros de desempenho órfãos.
-- Exemplo de correção: DELETE FROM public.daily_performance WHERE worker_id = 'id_do_trabalhador_invalido';

SELECT
    dp.id AS performance_record_id,
    dp.worker_id AS invalid_worker_id,
    dp.date
FROM
    public.daily_performance dp
LEFT JOIN
    public.users u ON dp.worker_id = u.id
WHERE
    u.id IS NULL;


-- ----------------------------------------------------------------
-- CHECK 5: Logs de requisição com referências inválidas
-- ----------------------------------------------------------------
-- Descrição: Procura por logs de requisição que apontam para requisições ou usuários que não existem.
-- Ação se encontrar: Apague estes logs órfãos.
-- Exemplo de correção: DELETE FROM public.requisition_logs WHERE id = 'log_id_encontrado';

SELECT
    rl.id AS log_id,
    CASE WHEN r.id IS NULL THEN rl.requisition_id ELSE NULL END AS invalid_requisition_id,
    CASE WHEN u.id IS NULL THEN rl.actor_id ELSE NULL END AS invalid_actor_id
FROM
    public.requisition_logs rl
LEFT JOIN
    public.requisitions r ON rl.requisition_id = r.id
LEFT JOIN
    public.users u ON rl.actor_id = u.id
WHERE
    r.id IS NULL
    OR u.id IS NULL;

-- ================================================================
-- FIM DO SCRIPT DE DIAGNÓSTICO
-- ================================================================
