-- Função RPC otimizada para buscar o feed social
-- Esta função reduz as queries N+1 e melhora a performance significativamente

CREATE OR REPLACE FUNCTION get_social_posts_feed_optimized(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    user_username TEXT,
    user_avatar_url TEXT,
    book_id UUID,
    book_title TEXT,
    book_author TEXT,
    book_cover_url TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    is_liked BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.content,
        sp.image_url,
        sp.created_at,
        sp.updated_at,
        sp.user_id,
        p.username as user_username,
        p.avatar_url as user_avatar_url,
        sp.book_id,
        b.title as book_title,
        b.author as book_author,
        b.cover_url as book_cover_url,
        COALESCE(likes.count, 0) as likes_count,
        COALESCE(comments.count, 0) as comments_count,
        COALESCE(user_likes.liked, false) as is_liked
    FROM social_posts sp
    LEFT JOIN profiles p ON sp.user_id = p.id
    LEFT JOIN books b ON sp.book_id = b.id
    LEFT JOIN (
        SELECT 
            post_id, 
            COUNT(*) as count 
        FROM post_likes 
        GROUP BY post_id
    ) likes ON sp.id = likes.post_id
    LEFT JOIN (
        SELECT 
            post_id, 
            COUNT(*) as count 
        FROM post_comments 
        GROUP BY post_id
    ) comments ON sp.id = comments.post_id
    LEFT JOIN (
        SELECT 
            post_id, 
            true as liked 
        FROM post_likes 
        WHERE user_id = p_user_id
    ) user_likes ON sp.id = user_likes.post_id
    ORDER BY sp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Criar índices para otimizar as queries
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