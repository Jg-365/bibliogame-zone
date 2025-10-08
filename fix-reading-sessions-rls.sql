-- ====================================
-- FIX: Permitir visualização pública das sessões de leitura
-- ====================================
-- 
-- PROBLEMA: A política atual só permite que usuários vejam suas próprias sessões
-- SOLUÇÃO: Alterar para permitir que qualquer um veja as sessões (informação pública)
--
-- COMO EXECUTAR:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- ====================================

-- Remove a política antiga que restringe visualização
DROP POLICY IF EXISTS "Users can view their reading sessions" ON public.reading_sessions;

-- Cria nova política que permite visualização pública
CREATE POLICY "Anyone can view reading sessions" 
  ON public.reading_sessions 
  FOR SELECT 
  USING (true);

-- As políticas de INSERT, UPDATE e DELETE continuam restritas ao próprio usuário
-- (Não precisamos alterar essas)

-- Verificar se funcionou:
-- SELECT * FROM public.reading_sessions LIMIT 10;
