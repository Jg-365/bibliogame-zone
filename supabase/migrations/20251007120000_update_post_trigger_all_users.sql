-- Modificar trigger de posts para notificar TODOS os usuários (não apenas seguidores)

-- 1. Remover trigger antigo
DROP TRIGGER IF EXISTS on_post_created ON social_posts;
DROP FUNCTION IF EXISTS notify_on_post();

-- 2. Criar nova função que notifica TODOS os usuários
CREATE OR REPLACE FUNCTION notify_on_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação para TODOS os usuários (exceto quem postou)
  INSERT INTO notification_queue (user_id, notification_type, trigger_user_id, data)
  SELECT 
    p.id,
    'post',
    NEW.user_id,
    jsonb_build_object(
      'post_id', NEW.id,
      'post_content', LEFT(NEW.content, 200),
      'created_at', NEW.created_at
    )
  FROM profiles p
  JOIN notification_preferences np ON np.user_id = p.id
  WHERE p.id != NEW.user_id  -- Não notificar quem postou
    AND np.email_notifications_enabled = true
    AND np.notify_on_post = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar trigger
CREATE TRIGGER on_post_created
  AFTER INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_post();

-- Comentário explicativo
COMMENT ON FUNCTION notify_on_post() IS 'Notifica TODOS os usuários (não apenas seguidores) quando há um novo post';
