-- Migration: Email Notifications System
-- Create tables and triggers for email notifications

-- Table for notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  notify_on_follow BOOLEAN DEFAULT TRUE,
  notify_on_comment BOOLEAN DEFAULT TRUE,
  notify_on_like BOOLEAN DEFAULT TRUE,
  notify_on_post BOOLEAN DEFAULT TRUE,
  daily_reading_reminder BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '20:00:00', -- 8 PM padrão
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table for notification queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'follow', 'comment', 'like', 'post', 'reading_reminder'
  trigger_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- quem causou a notificação
  related_entity_id UUID, -- ID do post, comentário, etc
  related_entity_type TEXT, -- 'post', 'comment', etc
  data JSONB, -- dados adicionais
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_queue
CREATE POLICY "Users can view their own notifications"
  ON public.notification_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS create_notification_preferences_on_signup ON auth.users;
CREATE TRIGGER create_notification_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to queue notification on new follow
CREATE OR REPLACE FUNCTION queue_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_prefs RECORD;
BEGIN
  -- Get notification preferences
  SELECT * INTO follower_prefs
  FROM public.notification_preferences
  WHERE user_id = NEW.following_id;

  -- Only queue if user has notifications enabled
  IF follower_prefs.email_notifications_enabled AND follower_prefs.notify_on_follow THEN
    INSERT INTO public.notification_queue (
      user_id,
      notification_type,
      trigger_user_id,
      related_entity_id,
      data
    ) VALUES (
      NEW.following_id,
      'follow',
      NEW.follower_id,
      NEW.id,
      jsonb_build_object(
        'follower_id', NEW.follower_id,
        'followed_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follows
DROP TRIGGER IF EXISTS notify_on_follow ON public.follows;
CREATE TRIGGER notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION queue_follow_notification();

-- Function to queue notification on new post from followed user
CREATE OR REPLACE FUNCTION queue_post_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  prefs RECORD;
BEGIN
  -- Get all followers of the user who created the post
  FOR follower IN
    SELECT follower_id
    FROM public.follows
    WHERE following_id = NEW.user_id
  LOOP
    -- Get notification preferences
    SELECT * INTO prefs
    FROM public.notification_preferences
    WHERE user_id = follower.follower_id;

    -- Only queue if user has notifications enabled
    IF prefs.email_notifications_enabled AND prefs.notify_on_post THEN
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
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new posts
DROP TRIGGER IF EXISTS notify_on_post ON public.social_posts;
CREATE TRIGGER notify_on_post
  AFTER INSERT ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION queue_post_notification();

-- Function to queue notification on new comment
CREATE OR REPLACE FUNCTION queue_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  prefs RECORD;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author
  FROM public.social_posts
  WHERE id = NEW.post_id;

  -- Don't notify if commenting on own post
  IF post_author != NEW.user_id THEN
    -- Get notification preferences
    SELECT * INTO prefs
    FROM public.notification_preferences
    WHERE user_id = post_author;

    -- Only queue if user has notifications enabled
    IF prefs.email_notifications_enabled AND prefs.notify_on_comment THEN
      INSERT INTO public.notification_queue (
        user_id,
        notification_type,
        trigger_user_id,
        related_entity_id,
        related_entity_type,
        data
      ) VALUES (
        post_author,
        'comment',
        NEW.user_id,
        NEW.id,
        'comment',
        jsonb_build_object(
          'comment_id', NEW.id,
          'post_id', NEW.post_id,
          'comment_content', LEFT(NEW.content, 200),
          'created_at', NEW.created_at
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new comments
DROP TRIGGER IF EXISTS notify_on_comment ON public.post_comments;
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION queue_comment_notification();

-- Function to queue notification on new like
CREATE OR REPLACE FUNCTION queue_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  prefs RECORD;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author
  FROM public.social_posts
  WHERE id = NEW.post_id;

  -- Don't notify if liking own post
  IF post_author != NEW.user_id THEN
    -- Get notification preferences
    SELECT * INTO prefs
    FROM public.notification_preferences
    WHERE user_id = post_author;

    -- Only queue if user has notifications enabled
    IF prefs.email_notifications_enabled AND prefs.notify_on_like THEN
      INSERT INTO public.notification_queue (
        user_id,
        notification_type,
        trigger_user_id,
        related_entity_id,
        related_entity_type,
        data
      ) VALUES (
        post_author,
        'like',
        NEW.user_id,
        NEW.post_id,
        'post',
        jsonb_build_object(
          'post_id', NEW.post_id,
          'liked_at', NEW.created_at
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new likes
DROP TRIGGER IF EXISTS notify_on_like ON public.post_likes;
CREATE TRIGGER notify_on_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION queue_like_notification();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON public.notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON public.notification_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
