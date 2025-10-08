-- ================================================================
-- SCRIPT DE TESTES - Sistema de Notificações
-- ================================================================
-- Execute estes queries para verificar se tudo está funcionando
-- ================================================================

-- ============================================================
-- TESTE 1: Verificar se as tabelas foram criadas
-- ============================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notification_preferences', 'notification_queue')
ORDER BY table_name;

-- Resultado esperado: 2 linhas
-- notification_preferences | BASE TABLE
-- notification_queue      | BASE TABLE


-- ============================================================
-- TESTE 2: Verificar estrutura da tabela de preferências
-- ============================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- Deve mostrar todas as colunas:
-- id, user_id, email_notifications_enabled, notify_on_follow,
-- notify_on_comment, notify_on_like, notify_on_post,
-- daily_reading_reminder, reminder_time, created_at, updated_at


-- ============================================================
-- TESTE 3: Verificar estrutura da fila de notificações
-- ============================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_queue'
ORDER BY ordinal_position;

-- Deve mostrar todas as colunas:
-- id, user_id, notification_type, trigger_user_id,
-- related_entity_id, related_entity_type, data, sent, sent_at, created_at


-- ============================================================
-- TESTE 4: Verificar políticas RLS
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('notification_preferences', 'notification_queue')
ORDER BY tablename, policyname;

-- Deve mostrar as políticas de segurança criadas


-- ============================================================
-- TESTE 5: Verificar triggers criados
-- ============================================================
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%notif%'
ORDER BY event_object_table, trigger_name;

-- Deve mostrar os triggers:
-- - notify_on_follow (tabela: follows)
-- - notify_on_post (tabela: social_posts)
-- - notify_on_comment (tabela: post_comments)
-- - notify_on_like (tabela: post_likes)


-- ============================================================
-- TESTE 6: Verificar cron jobs configurados
-- ============================================================
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('process-notifications', 'daily-reminders')
ORDER BY jobname;

-- Resultado esperado: 2 jobs ativos
-- daily-reminders        | 0 * * * *   | true
-- process-notifications | */5 * * * * | true


-- ============================================================
-- TESTE 7: Ver preferências de notificação dos usuários
-- ============================================================
SELECT 
  np.id,
  p.username,
  np.email_notifications_enabled,
  np.notify_on_follow,
  np.notify_on_post,
  np.daily_reading_reminder,
  np.reminder_time,
  np.created_at
FROM notification_preferences np
LEFT JOIN profiles p ON p.id = np.user_id
ORDER BY np.created_at DESC
LIMIT 10;

-- Se não houver dados, isso é normal (preferências são criadas quando o usuário acessa)


-- ============================================================
-- TESTE 8: Ver fila de notificações
-- ============================================================
SELECT 
  nq.id,
  nq.notification_type,
  p_recipient.username as recipient,
  p_trigger.username as triggered_by,
  nq.sent,
  nq.created_at,
  nq.sent_at
FROM notification_queue nq
LEFT JOIN profiles p_recipient ON p_recipient.id = nq.user_id
LEFT JOIN profiles p_trigger ON p_trigger.id = nq.trigger_user_id
ORDER BY nq.created_at DESC
LIMIT 20;

-- Mostra as últimas 20 notificações (se houver)


-- ============================================================
-- TESTE 9: Estatísticas da fila
-- ============================================================
SELECT 
  notification_type,
  COUNT(*) FILTER (WHERE sent = false) as pendentes,
  COUNT(*) FILTER (WHERE sent = true) as enviadas,
  COUNT(*) as total
FROM notification_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type
ORDER BY total DESC;

-- Mostra estatísticas dos últimos 7 dias


-- ============================================================
-- TESTE 10: Verificar últimas execuções dos cron jobs
-- ============================================================
SELECT 
  j.jobname,
  jrd.runid,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('process-notifications', 'daily-reminders')
ORDER BY jrd.start_time DESC
LIMIT 10;

-- Mostra as últimas execuções dos cron jobs
-- (Pode estar vazio se os jobs ainda não executaram)


-- ================================================================
-- QUERIES ÚTEIS PARA MONITORAMENTO
-- ================================================================

-- Contar usuários com notificações ativas:
-- SELECT COUNT(*) as usuarios_ativos
-- FROM notification_preferences
-- WHERE email_notifications_enabled = true;

-- Ver notificações não enviadas:
-- SELECT COUNT(*) as notificacoes_pendentes
-- FROM notification_queue
-- WHERE sent = false;

-- Taxa de sucesso de envio (últimas 24h):
-- SELECT 
--   COUNT(*) FILTER (WHERE sent = true) * 100.0 / COUNT(*) as taxa_sucesso_pct,
--   COUNT(*) FILTER (WHERE sent = true) as enviadas,
--   COUNT(*) FILTER (WHERE sent = false) as pendentes
-- FROM notification_queue
-- WHERE created_at > NOW() - INTERVAL '24 hours';

-- ================================================================
-- COMANDOS PARA LIMPAR DADOS DE TESTE
-- ================================================================

-- CUIDADO! Só use em desenvolvimento
-- Remove todas as notificações:
-- DELETE FROM notification_queue;

-- Remove todas as preferências:
-- DELETE FROM notification_preferences;

-- ================================================================
-- TESTE MANUAL: Criar uma notificação de teste
-- ================================================================

-- Substitua USER_ID_DESTINATARIO pelo seu user_id
-- Substitua USER_ID_REMETENTE pelo user_id de outro usuário (ou o mesmo)

-- INSERT INTO notification_queue (
--   user_id,
--   notification_type,
--   trigger_user_id,
--   data
-- ) VALUES (
--   'USER_ID_DESTINATARIO',
--   'follow',
--   'USER_ID_REMETENTE',
--   jsonb_build_object(
--     'follower_id', 'USER_ID_REMETENTE',
--     'followed_at', NOW()
--   )
-- );

-- Depois verifique se aparece na fila:
-- SELECT * FROM notification_queue WHERE sent = false ORDER BY created_at DESC LIMIT 1;

-- ================================================================
