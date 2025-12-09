-- CUIDADO: Este script irá apagar dados da sua base de dados.
-- FAÇA UM BACKUP ANTES DE EXECUTAR.

-- Passo 1: Antes de apagar as localizações, é importante saber se existem usuários
-- alocados a elas. O ideal é re-alocar estes usuários para outra localização
-- (como a Sede Central) antes de apagar.

-- Este comando mostra os usuários que pertencem a localizações que SERÃO APAGADAS.
-- Re-aloque estes usuários antes de continuar.
SELECT id, name, email, location_id
FROM users
WHERE location_id IN (SELECT id FROM locations WHERE type != 'CENTRAL');

-- Passo 2: Apagar as localizações.
-- Este comando apaga TODAS as localizações que NÃO SÃO do tipo 'CENTRAL'.
-- A sua "Sede Central" será preservada.
DELETE FROM locations WHERE type != 'CENTRAL';

-- Confirme que as localizações foram apagadas (deve retornar apenas a Sede Central).
SELECT * FROM locations;
