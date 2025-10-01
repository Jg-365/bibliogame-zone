-- Create posts table for social feed
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reading_session', 'achievement', 'reflection', 'photo')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Users can view all post comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- Function to automatically create posts for reading sessions
CREATE OR REPLACE FUNCTION create_reading_session_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create post if pages_read > 0
  IF NEW.pages_read > 0 THEN
    INSERT INTO posts (user_id, content, type, metadata)
    VALUES (
      NEW.user_id,
      'Leu ' || NEW.pages_read || ' páginas hoje! 📖',
      'reading_session',
      jsonb_build_object(
        'pages_read', NEW.pages_read,
        'book_id', NEW.book_id,
        'session_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create posts for reading sessions
DROP TRIGGER IF EXISTS create_reading_session_post_trigger ON reading_sessions;
CREATE TRIGGER create_reading_session_post_trigger
  AFTER INSERT ON reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_reading_session_post();

-- Function to automatically create posts for achievements
CREATE OR REPLACE FUNCTION create_achievement_post()
RETURNS TRIGGER AS $$
DECLARE
  achievement_title TEXT;
  achievement_description TEXT;
BEGIN
  -- Get achievement details
  SELECT title, description INTO achievement_title, achievement_description
  FROM achievements 
  WHERE id = NEW.achievement_id;
  
  -- Create post for new achievement
  INSERT INTO posts (user_id, content, type, metadata)
  VALUES (
    NEW.user_id,
    'Desbloqueou uma nova conquista: ' || achievement_title || '! 🏆',
    'achievement',
    jsonb_build_object(
      'achievement_id', NEW.achievement_id,
      'achievement_title', achievement_title,
      'achievement_description', achievement_description
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create posts for achievements
DROP TRIGGER IF EXISTS create_achievement_post_trigger ON user_achievements;
CREATE TRIGGER create_achievement_post_trigger
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_post();