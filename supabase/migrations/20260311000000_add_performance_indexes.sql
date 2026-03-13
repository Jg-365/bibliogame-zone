-- Performance indexes for social feed and core tables.
-- Applied via: supabase db push

-- social_posts: most queries sort by recency
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at
  ON social_posts (created_at DESC);

-- post_likes: lookups by post and by (user, post) pair
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id
  ON post_likes (post_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_post
  ON post_likes (user_id, post_id);

-- post_comments: lookups by post
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
  ON post_comments (post_id);

-- profiles & books: primary-key lookups (covers joins)
CREATE INDEX IF NOT EXISTS idx_profiles_id
  ON profiles (id);

CREATE INDEX IF NOT EXISTS idx_books_id
  ON books (id);

-- Refresh statistics so the query planner uses the new indexes
ANALYZE social_posts;
ANALYZE post_likes;
ANALYZE post_comments;
ANALYZE profiles;
ANALYZE books;
