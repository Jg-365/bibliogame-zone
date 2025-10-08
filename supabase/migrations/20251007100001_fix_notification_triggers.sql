-- Fix: Recriar triggers de notificação
-- Este script garante que todos os triggers estão funcionando

-- 1. Recriar função de notificação de post
CREATE OR REPLACE FUNCTION queue_post_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  prefs RECORD;
BEGIN
  -- Log para debug
  RAISE NOTICE 'Trigger disparado! Post ID: %, User ID: %', NEW.id, NEW.user_id;
  
  -- Get all followers of the user who created the post
  FOR follower IN
    SELECT follower_id
    FROM public.follows
    WHERE following_id = NEW.user_id
  LOOP
    RAISE NOTICE 'Seguidor encontrado: %', follower.follower_id;
    
    -- Get notification preferences
    SELECT * INTO prefs
    FROM public.notification_preferences
    WHERE user_id = follower.follower_id;

    -- Only queue if user has notifications enabled
    IF prefs IS NOT NULL AND prefs.email_notifications_enabled AND prefs.notify_on_post THEN
      RAISE NOTICE 'Criando notificação para: %', follower.follower_id;
      
      INSERT INTO public.notification_queue (
        user_id,
        notification_type,
        trigger_user_id,
        related_entity_id,
        related_entity_type,
        data
      ) VALUES (
        follower.follower_id,
        'post',
        NEW.user_id,
        NEW.id,
        'post',
        jsonb_build_object(
          'post_id', NEW.id,
          'post_content', LEFT(NEW.content, 200),
          'created_at', NEW.created_at
        )
      );
    ELSE
      RAISE NOTICE 'Notificações desabilitadas para: %', follower.follower_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar trigger em social_posts
DROP TRIGGER IF EXISTS notify_on_post ON public.social_posts;
CREATE TRIGGER notify_on_post
  AFTER INSERT ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION queue_post_notification();

-- 3. Garantir que a tabela notification_preferences tem valores padrão para todos os usuários
INSERT INTO public.notification_preferences (
  user_id,
  email_notifications_enabled,
  notify_on_follow,
  notify_on_comment,
  notify_on_like,
  notify_on_post,
  daily_reading_reminder
)
SELECT 
  id,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET
  email_notifications_enabled = COALESCE(notification_preferences.email_notifications_enabled, TRUE),
  notify_on_post = COALESCE(notification_preferences.notify_on_post, TRUE);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_sent 
  ON public.notification_queue(user_id, sent);

CREATE INDEX IF NOT EXISTS idx_notification_queue_created 
  ON public.notification_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_following 
  ON public.follows(following_id);
