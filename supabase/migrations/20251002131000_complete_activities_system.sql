-- Sistema completo de atividades recentes
-- Tabela para registrar todas as atividades dos usuários

-- Criar tabela de atividades
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'book_added', 'book_completed', 'book_started', 
        'reading_session', 'post_created', 'post_liked', 
        'comment_added', 'achievement_unlocked', 'profile_updated'
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- RLS para atividades
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para atividades (usuários podem ver suas próprias atividades e de outros para feed social)
CREATE POLICY "Users can view all activities" ON user_activities
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para criar atividade
CREATE OR REPLACE FUNCTION create_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funções para capturar atividades automaticamente

-- 1. Atividades de livros
CREATE OR REPLACE FUNCTION log_book_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    metadata_obj JSONB;
BEGIN
    metadata_obj := jsonb_build_object(
        'book_id', NEW.id,
        'book_title', NEW.title,
        'book_author', NEW.author,
        'book_cover', NEW.cover_url
    );

    -- Livro adicionado
    IF TG_OP = 'INSERT' THEN
        activity_desc := 'Adicionou "' || NEW.title || '" de ' || NEW.author || ' à biblioteca';
        PERFORM create_user_activity(NEW.user_id, 'book_added', activity_desc, metadata_obj);
    
    -- Livro iniciado
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'reading' AND NEW.status = 'reading' THEN
        activity_desc := 'Começou a ler "' || NEW.title || '"';
        PERFORM create_user_activity(NEW.user_id, 'book_started', activity_desc, metadata_obj);
    
    -- Livro completado
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        activity_desc := 'Terminou de ler "' || NEW.title || '" (' || NEW.total_pages || ' páginas)';
        metadata_obj := metadata_obj || jsonb_build_object('pages_read', NEW.total_pages, 'rating', NEW.rating);
        PERFORM create_user_activity(NEW.user_id, 'book_completed', activity_desc, metadata_obj);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Atividades de sessões de leitura
CREATE OR REPLACE FUNCTION log_reading_session_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    book_title TEXT;
    metadata_obj JSONB;
BEGIN
    -- Buscar título do livro
    SELECT title INTO book_title FROM books WHERE id = NEW.book_id;
    
    activity_desc := 'Leu ' || NEW.pages_read || ' páginas de "' || book_title || '"';
    
    metadata_obj := jsonb_build_object(
        'book_id', NEW.book_id,
        'book_title', book_title,
        'pages_read', NEW.pages_read,
        'session_date', NEW.session_date,
        'notes', NEW.notes
    );

    PERFORM create_user_activity(NEW.user_id, 'reading_session', activity_desc, metadata_obj);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Atividades de posts
CREATE OR REPLACE FUNCTION log_post_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    book_title TEXT;
    metadata_obj JSONB;
BEGIN
    -- Buscar título do livro se associado
    IF NEW.book_id IS NOT NULL THEN
        SELECT title INTO book_title FROM books WHERE id = NEW.book_id;
        activity_desc := 'Criou um post sobre "' || book_title || '"';
    ELSE
        activity_desc := 'Criou um novo post';
    END IF;
    
    metadata_obj := jsonb_build_object(
        'post_id', NEW.id,
        'content_preview', LEFT(NEW.content, 100),
        'book_id', NEW.book_id,
        'book_title', book_title,
        'has_image', (NEW.image_url IS NOT NULL)
    );

    PERFORM create_user_activity(NEW.user_id, 'post_created', activity_desc, metadata_obj);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Atividades de curtidas
CREATE OR REPLACE FUNCTION log_like_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    post_author UUID;
    post_content TEXT;
    metadata_obj JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Buscar informações do post
        SELECT user_id, LEFT(content, 50) INTO post_author, post_content 
        FROM social_posts WHERE id = NEW.post_id;
        
        activity_desc := 'Curtiu um post: "' || post_content || '..."';
        
        metadata_obj := jsonb_build_object(
            'post_id', NEW.post_id,
            'post_author_id', post_author,
            'like_id', NEW.id
        );

        PERFORM create_user_activity(NEW.user_id, 'post_liked', activity_desc, metadata_obj);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Atividades de comentários
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    post_author UUID;
    post_content TEXT;
    metadata_obj JSONB;
BEGIN
    -- Buscar informações do post
    SELECT user_id, LEFT(content, 50) INTO post_author, post_content 
    FROM social_posts WHERE id = NEW.post_id;
    
    activity_desc := 'Comentou em um post: "' || post_content || '..."';
    
    metadata_obj := jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'comment_content', LEFT(NEW.content, 100),
        'post_author_id', post_author
    );

    PERFORM create_user_activity(NEW.user_id, 'comment_added', activity_desc, metadata_obj);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Atividades de conquistas
CREATE OR REPLACE FUNCTION log_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_desc TEXT;
    achievement_title TEXT;
    achievement_icon TEXT;
    metadata_obj JSONB;
BEGIN
    -- Buscar informações da conquista
    SELECT title, icon INTO achievement_title, achievement_icon 
    FROM achievements WHERE id = NEW.achievement_id;
    
    activity_desc := 'Desbloqueou a conquista "' || achievement_title || '" ' || achievement_icon;
    
    metadata_obj := jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'achievement_title', achievement_title,
        'achievement_icon', achievement_icon
    );

    PERFORM create_user_activity(NEW.user_id, 'achievement_unlocked', activity_desc, metadata_obj);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para capturar atividades
DROP TRIGGER IF EXISTS log_book_activity_trigger ON books;
CREATE TRIGGER log_book_activity_trigger
    AFTER INSERT OR UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION log_book_activity();

DROP TRIGGER IF EXISTS log_reading_session_activity_trigger ON reading_sessions;
CREATE TRIGGER log_reading_session_activity_trigger
    AFTER INSERT ON reading_sessions
    FOR EACH ROW EXECUTE FUNCTION log_reading_session_activity();

DROP TRIGGER IF EXISTS log_post_activity_trigger ON social_posts;
CREATE TRIGGER log_post_activity_trigger
    AFTER INSERT ON social_posts
    FOR EACH ROW EXECUTE FUNCTION log_post_activity();

DROP TRIGGER IF EXISTS log_like_activity_trigger ON post_likes;
CREATE TRIGGER log_like_activity_trigger
    AFTER INSERT ON post_likes
    FOR EACH ROW EXECUTE FUNCTION log_like_activity();

DROP TRIGGER IF EXISTS log_comment_activity_trigger ON post_comments;
CREATE TRIGGER log_comment_activity_trigger
    AFTER INSERT ON post_comments
    FOR EACH ROW EXECUTE FUNCTION log_comment_activity();

DROP TRIGGER IF EXISTS log_achievement_activity_trigger ON user_achievements;
CREATE TRIGGER log_achievement_activity_trigger
    AFTER INSERT ON user_achievements
    FOR EACH ROW EXECUTE FUNCTION log_achievement_activity();

-- Função para buscar atividades recentes
CREATE OR REPLACE FUNCTION get_recent_activities(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    activity_type TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    user_username TEXT,
    user_avatar_url TEXT,
    user_full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.user_id,
        ua.activity_type,
        ua.description,
        ua.metadata,
        ua.created_at,
        p.username as user_username,
        p.avatar_url as user_avatar_url,
        p.full_name as user_full_name
    FROM user_activities ua
    LEFT JOIN profiles p ON ua.user_id = p.user_id
    WHERE (p_user_id IS NULL OR ua.user_id = p_user_id)
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;