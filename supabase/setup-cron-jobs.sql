-- ================================================================
-- SCRIPT DE CONFIGURAÇÃO DOS CRON JOBS
-- Sistema de Notificações - ReadQuest
-- ================================================================
-- 
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard do seu projeto
-- 2. Vá em: SQL Editor → New Query
-- 3. SUBSTITUA os valores marcados com YOUR_... abaixo
-- 4. Execute o script completo (Ctrl+Enter ou botão RUN)
-- 
-- ONDE ENCONTRAR OS VALORES:
-- - YOUR_PROJECT_REF: Dashboard → Settings → API → Project URL
--   Exemplo: se a URL é "https://abcdefgh.supabase.co", use "abcdefgh"
-- 
-- - YOUR_ANON_KEY: Dashboard → Settings → API → Project API keys
--   Copie a chave "anon" "public" (não a service_role!)
-- 
-- ================================================================

-- ============================================================
-- PASSO 1: Habilitar extensão pg_cron (apenas uma vez)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- PASSO 2: Limpar cron jobs antigos (se existirem)
-- ============================================================
-- Se você já criou os jobs antes, descomente as linhas abaixo:
-- SELECT cron.unschedule('process-notifications');
-- SELECT cron.unschedule('daily-reminders');

-- ============================================================
-- PASSO 3: Criar Cron Job - Processar Notificações
-- Executa a cada 5 minutos
-- ============================================================
SELECT cron.schedule(
  'process-notifications',              -- Nome do job
  '*/5 * * * *',                       -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- PASSO 4: Criar Cron Job - Lembretes Diários
-- Executa a cada hora (para verificar se é hora de lembrar)
-- ============================================================
SELECT cron.schedule(
  'daily-reminders',                   -- Nome do job
  '0 * * * *',                        -- A cada hora (minuto 0)
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- PASSO 5: Verificar se os cron jobs foram criados
-- ============================================================
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
ORDER BY jobid DESC;

-- ============================================================
-- RESULTADO ESPERADO:
-- Deve mostrar 2 jobs:
-- 1. process-notifications (*/5 * * * *)
-- 2. daily-reminders (0 * * * *)
-- Ambos com active = true
-- ============================================================

-- ================================================================
-- COMANDOS ÚTEIS (para debug)
-- ================================================================

-- Ver histórico de execuções (últimas 10):
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('process-notifications', 'daily-reminders'))
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Pausar um job temporariamente:
-- UPDATE cron.job SET active = false WHERE jobname = 'process-notifications';

-- Reativar um job:
-- UPDATE cron.job SET active = true WHERE jobname = 'process-notifications';

-- Remover um job completamente:
-- SELECT cron.unschedule('process-notifications');

-- ================================================================
-- CRONOGRAMA DOS JOBS:
-- ================================================================
-- 
-- process-notifications:
--   - Executa: A cada 5 minutos
--   - Horários: 00:00, 00:05, 00:10, 00:15, 00:20, etc.
--   - Função: Processa a fila e envia e-mails pendentes
-- 
-- daily-reminders:
--   - Executa: A cada hora (no minuto 0)
--   - Horários: 00:00, 01:00, 02:00, ..., 23:00
--   - Função: Verifica se é hora de enviar lembretes diários
-- 
-- ================================================================
