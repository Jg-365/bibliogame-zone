-- Enhanced profiles table with gamification features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create followers/following system
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Enhanced books table with more metadata
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS genres TEXT[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_started_at TIMESTAMP WITH TIME ZONE;

-- Create reading sessions for detailed tracking
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pages_read INTEGER NOT NULL CHECK (pages_read > 0),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reading sessions" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reading sessions" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reading sessions" ON public.reading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their reading sessions" ON public.reading_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create challenges system
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'community', 'club')),
  target_type TEXT NOT NULL CHECK (target_type IN ('books', 'pages', 'streak')),
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_points INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by everyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their challenges" ON public.challenges FOR UPDATE USING (auth.uid() = created_by);

-- User challenge participation
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenge progress" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their challenge progress" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Create book clubs
CREATE TABLE public.book_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_image TEXT,
  is_private BOOLEAN DEFAULT false,
  member_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.book_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book clubs are viewable by members" ON public.book_clubs FOR SELECT USING (
  NOT is_private OR EXISTS (
    SELECT 1 FROM public.book_club_members 
    WHERE club_id = id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create book clubs" ON public.book_clubs FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their clubs" ON public.book_clubs FOR UPDATE USING (auth.uid() = creator_id);

-- Book club members
CREATE TABLE public.book_club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.book_club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view membership" ON public.book_club_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.book_club_members WHERE club_id = book_club_members.club_id AND user_id = auth.uid())
);
CREATE POLICY "Users can join clubs" ON public.book_club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.book_club_members FOR DELETE USING (auth.uid() = user_id);

-- Activity feed
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('book_completed', 'book_started', 'achievement_unlocked', 'challenge_completed', 'review_added')),
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities from followed users" ON public.activities FOR SELECT USING (
  is_public AND (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id)
  )
);
CREATE POLICY "Users can create their activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Book recommendations
CREATE TABLE public.book_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_book_data JSONB NOT NULL,
  score NUMERIC(3,2) CHECK (score >= 0 AND score <= 1),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their recommendations" ON public.book_recommendations FOR SELECT USING (auth.uid() = user_id);

-- Book comments/reviews
CREATE TABLE public.book_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (char_length(comment) <= 200),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by followers" ON public.book_comments FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = book_comments.user_id AND NOT is_private)
);
CREATE POLICY "Users can create comments" ON public.book_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comments" ON public.book_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON public.book_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_book_comments_updated_at
  BEFORE UPDATE ON public.book_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Likes system for comments
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.book_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Add more achievements
INSERT INTO public.achievements (title, description, icon, rarity, requirement_type, requirement_value) VALUES
('Crítico Literário', 'Escreva 10 resenhas', 'MessageSquare', 'rare', 'reviews_written', 10),
('Social Reader', 'Ganhe 50 likes em seus comentários', 'Heart', 'epic', 'likes_received', 50),
('Streak Master', 'Mantenha uma sequência de 7 dias lendo', 'Flame', 'rare', 'streak_days', 7),
('Velocista', 'Leia 3 livros em um mês', 'Zap', 'epic', 'books_monthly', 3),
('Explorador de Gêneros', 'Leia livros de 5 gêneros diferentes', 'Compass', 'rare', 'genres_read', 5);

-- Functions for gamification

-- Update user stats when book is completed
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If book status changed to completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Update profile stats
    UPDATE public.profiles 
    SET 
      books_completed = books_completed + 1,
      points = points + 10 + (NEW.total_pages / 50), -- 10 base points + 1 per 50 pages
      total_pages_read = total_pages_read + NEW.total_pages,
      last_activity = CURRENT_DATE
    WHERE user_id = NEW.user_id;
    
    -- Set completion date
    NEW.date_completed = now();
    
    -- Create activity
    INSERT INTO public.activities (user_id, type, data) VALUES
    (NEW.user_id, 'book_completed', json_build_object('book_title', NEW.title, 'author', NEW.author));
    
    -- Check for achievements
    PERFORM check_user_achievements(NEW.user_id);
  END IF;
  
  -- Update reading streak
  IF NEW.pages_read > OLD.pages_read THEN
    PERFORM update_reading_streak(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_book_update
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to update reading streak
CREATE OR REPLACE FUNCTION update_reading_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  last_activity_date DATE;
  current_streak INTEGER;
BEGIN
  SELECT last_activity, reading_streak INTO last_activity_date, current_streak
  FROM public.profiles WHERE user_id = p_user_id;
  
  IF last_activity_date = CURRENT_DATE THEN
    -- Already updated today
    RETURN;
  ELSIF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak := current_streak + 1;
  ELSE
    -- Streak broken
    current_streak := 1;
  END IF;
  
  UPDATE public.profiles 
  SET 
    reading_streak = current_streak,
    best_streak = GREATEST(best_streak, current_streak),
    last_activity = CURRENT_DATE
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
BEGIN
  -- Get user stats
  SELECT books_completed, total_pages_read, reading_streak
  INTO user_stats
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Check each achievement
  FOR achievement IN 
    SELECT * FROM public.achievements 
    WHERE id NOT IN (
      SELECT achievement_id FROM public.user_achievements WHERE user_id = p_user_id
    )
  LOOP
    CASE achievement.requirement_type
      WHEN 'books_read' THEN
        IF user_stats.books_completed >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          INSERT INTO public.activities (user_id, type, data) VALUES
          (p_user_id, 'achievement_unlocked', json_build_object('achievement_title', achievement.title));
        END IF;
      WHEN 'pages_read' THEN
        IF user_stats.total_pages_read >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          INSERT INTO public.activities (user_id, type, data) VALUES
          (p_user_id, 'achievement_unlocked', json_build_object('achievement_title', achievement.title));
        END IF;
      WHEN 'streak_days' THEN
        IF user_stats.reading_streak >= achievement.requirement_value THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          INSERT INTO public.activities (user_id, type, data) VALUES
          (p_user_id, 'achievement_unlocked', json_build_object('achievement_title', achievement.title));
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_user_status ON public.books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON public.reading_sessions(user_id, session_date);

-- Create view for leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.points,
  p.level,
  p.books_completed,
  p.total_pages_read,
  p.reading_streak,
  RANK() OVER (ORDER BY p.points DESC) as rank
FROM public.profiles p
WHERE NOT p.is_private
ORDER BY p.points DESC;

-- Grant access to view
GRANT SELECT ON public.leaderboard TO authenticated;

-- RLS for leaderboard (public view)
CREATE POLICY "Leaderboard is viewable by authenticated users" ON public.leaderboard FOR SELECT TO authenticated USING (true);
