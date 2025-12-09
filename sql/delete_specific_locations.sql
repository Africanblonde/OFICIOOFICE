-- CUIDADO: Este script irá apagar dados ESPECÍFICOS da sua base de dados.
-- FAÇA UM BACKUP ANTES DE EXECUTAR.

-- Ocorreu um problema de duplicação de localizações do tipo 'CENTRAL'.
-- Este script irá apagar as duas localizações centrais identificadas.

-- Passo 1: Re-alocar usuários (MUITO IMPORTANTE)
-- Antes de apagar, verifique se algum usuário está alocado a estas localizações.
-- Se estiverem, você PRECISA mudar o 'location_id' deles para um ID de uma localização válida,
-- ou para NULL se a sua lógica de negócio permitir.

-- Rode este comando para encontrar os usuários afetados:
SELECT id, name, email, location_id
FROM users
WHERE location_id IN (
  '00000000-0000-0000-0000-000000000001',
  'bd326fe0-6eab-422a-8c43-010a2f10835a'
);

-- Exemplo de como re-alocar um usuário (substitua 'novo_id_localizacao' e 'id_do_usuario'):
-- UPDATE users SET location_id = 'novo_id_localizacao' WHERE id = 'id_do_usuario';


-- Passo 2: Apagar as localizações duplicadas
-- Este comando apaga as duas localizações centrais especificadas.
-- Certifique-se de que nenhum usuário está alocado a elas antes de executar.

DELETE FROM locations
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  'bd326fe0-6eab-422a-8c43-010a2f10835a'
);

-- Passo 3: Verificação
-- Confirme que as localizações foram apagadas. Este comando não deve retornar nada.
SELECT * FROM locations
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  'bd326fe0-6eab-422a-8c43-010a2f10835a'
);

-- Lembrete: Após apagar as localizações centrais, você precisará criar uma nova
-- para que a lógica de criação de filiais funcione corretamente.
-- Você pode fazer isso através da interface da aplicação em 'Definições'.
