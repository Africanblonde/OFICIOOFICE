-- =============================================
-- TESTE: DESABILITAR TRIGGER TEMPORARIAMENTE
-- =============================================
-- Se o login funcionar sem o trigger, sabemos que ele é o problema

-- =============================================
-- OPÇÃO A: DESABILITAR O TRIGGER
-- =============================================
-- Execute esta query primeiro:

ALTER TABLE public.users DISABLE TRIGGER on_auth_user_created;

-- Agora TESTE O LOGIN no aplicativo
-- Se funcionar, o trigger é o problema!

-- =============================================
-- OPÇÃO B: REMOVER O TRIGGER COMPLETAMENTE
-- =============================================
-- Se desabilitar não funcionar, tente remover:

DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- Teste o login novamente

-- =============================================
-- OPÇÃO C: VERIFICAR SE O USUÁRIO JÁ EXISTE
-- =============================================
-- Liste todos os usuários que existem:

SELECT id, name, role FROM public.users ORDER BY created_at DESC;

-- Se você já existe na tabela, não precisa do trigger!

-- =============================================
-- RESTAURAR O TRIGGER (depois de testar)
-- =============================================
-- Se remover o trigger funcionar, recrie ele assim:

ALTER TABLE public.users ENABLE TRIGGER on_auth_user_created;

-- Ou recrie completamente:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
