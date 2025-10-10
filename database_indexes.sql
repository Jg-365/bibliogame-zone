-- Executar estes comandos SQL diretamente no painel do Supabase

-- Criar índices para otimizar as queries do feed social
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_books_id ON books(id);

-- Atualizar estatísticas das tabelas
ANALYZE social_posts;
ANALYZE post_likes;
ANALYZE post_comments;
ANALYZE profiles;
ANALYZE books;