-- Expandir sistema de conquistas com conquistas realmente úteis
-- Migration para adicionar conquistas baseadas em ações reais

-- Primeiro, limpar conquistas existentes e criar novas
DELETE FROM user_achievements;
DELETE FROM achievements;

-- Reset sequência se necessário
SELECT setval(pg_get_serial_sequence('achievements', 'id'), 1, false);

-- Conquistas baseadas em livros lidos
INSERT INTO achievements (id, title, description, icon, rarity, requirement_type, requirement_value) VALUES
-- Conquistas de livros lidos
('11111111-0000-0000-0000-000000000001', 'Primeiro Passo', 'Complete seu primeiro livro', '📚', 'common', 'books_read', 1),
('11111111-0000-0000-0000-000000000002', 'Leitor Iniciante', 'Complete 5 livros', '📖', 'common', 'books_read', 5),
('11111111-0000-0000-0000-000000000003', 'Leitor Dedicado', 'Complete 10 livros', '📗', 'rare', 'books_read', 10),
('11111111-0000-0000-0000-000000000004', 'Bibliófilo', 'Complete 25 livros', '📘', 'epic', 'books_read', 25),
('11111111-0000-0000-0000-000000000005', 'Mestre dos Livros', 'Complete 50 livros', '📙', 'legendary', 'books_read', 50),

-- Conquistas de páginas lidas
('22222222-0000-0000-0000-000000000001', 'Primeira Centena', 'Leia 100 páginas', '📄', 'common', 'pages_read', 100),
('22222222-0000-0000-0000-000000000002', 'Leitor Constante', 'Leia 1.000 páginas', '📃', 'common', 'pages_read', 1000),
('22222222-0000-0000-0000-000000000003', 'Devorador de Páginas', 'Leia 5.000 páginas', '📜', 'rare', 'pages_read', 5000),
('22222222-0000-0000-0000-000000000004', 'Oceano de Conhecimento', 'Leia 10.000 páginas', '🌊', 'epic', 'pages_read', 10000),
('22222222-0000-0000-0000-000000000005', 'Biblioteca Humana', 'Leia 25.000 páginas', '🏛️', 'legendary', 'pages_read', 25000),

-- Conquistas de sequência (streak)
('33333333-0000-0000-0000-000000000001', 'Começando o Hábito', 'Leia por 3 dias consecutivos', '🔥', 'common', 'streak_days', 3),
('33333333-0000-0000-0000-000000000002', 'Semana Literária', 'Leia por 7 dias consecutivos', '⭐', 'rare', 'streak_days', 7),
('33333333-0000-0000-0000-000000000003', 'Quinzena Dedicada', 'Leia por 15 dias consecutivos', '💎', 'rare', 'streak_days', 15),
('33333333-0000-0000-0000-000000000004', 'Mês Literário', 'Leia por 30 dias consecutivos', '👑', 'epic', 'streak_days', 30),
('33333333-0000-0000-0000-000000000005', 'Disciplina Férrea', 'Leia por 100 dias consecutivos', '🏆', 'legendary', 'streak_days', 100),

-- Conquistas sociais (novas)
('44444444-0000-0000-0000-000000000001', 'Primeira Interação', 'Crie seu primeiro post', '💬', 'common', 'posts_created', 1),
('44444444-0000-0000-0000-000000000002', 'Compartilhador Ativo', 'Crie 10 posts', '📢', 'rare', 'posts_created', 10),
('44444444-0000-0000-0000-000000000003', 'Influenciador Literário', 'Crie 25 posts', '🌟', 'epic', 'posts_created', 25),
('44444444-0000-0000-0000-000000000004', 'Primeira Curtida', 'Receba sua primeira curtida', '❤️', 'common', 'likes_received', 1),
('44444444-0000-0000-0000-000000000005', 'Popular', 'Receba 50 curtidas', '💖', 'rare', 'likes_received', 50),
('44444444-0000-0000-0000-000000000006', 'Celebridade Literária', 'Receba 200 curtidas', '🎭', 'epic', 'likes_received', 200),

-- Conquistas especiais
('55555555-0000-0000-0000-000000000001', 'Explorador de Gêneros', 'Leia livros de 5 gêneros diferentes', '🎨', 'rare', 'genres_read', 5),
('55555555-0000-0000-0000-000000000002', 'Velocista', 'Complete um livro em menos de 24 horas', '⚡', 'epic', 'speed_reader', 1),
('55555555-0000-0000-0000-000000000003', 'Maratonista', 'Leia mais de 500 páginas em um dia', '🏃', 'epic', 'pages_per_day', 500),
('55555555-0000-0000-0000-000000000004', 'Colecionador', 'Adicione 50 livros à sua biblioteca', '📚', 'rare', 'books_added', 50),
('55555555-0000-0000-0000-000000000005', 'Crítico Literário', 'Escreva resenhas para 10 livros', '✍️', 'rare', 'reviews_written', 10);

-- Criar função melhorada para verificar conquistas
CREATE OR REPLACE FUNCTION check_and_grant_achievements_enhanced(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, title TEXT, description TEXT, icon TEXT) AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
  new_achievement RECORD;
BEGIN
  -- Buscar estatísticas detalhadas do usuário
  SELECT 
    COALESCE(p.books_completed, 0) as books_completed,
    COALESCE(p.total_pages_read, 0) as total_pages_read,
    COALESCE(p.current_streak, 0) as current_streak,
    COALESCE(p.longest_streak, 0) as longest_streak,
    -- Contar posts criados
    (SELECT COUNT(*) FROM social_posts WHERE user_id = p_user_id) as posts_created,
    -- Contar curtidas recebidas
    (SELECT COUNT(*) FROM post_likes pl 
     JOIN social_posts sp ON pl.post_id = sp.id 
     WHERE sp.user_id = p_user_id) as likes_received,
    -- Contar livros adicionados
    (SELECT COUNT(*) FROM books WHERE user_id = p_user_id) as books_added,
    -- Contar resenhas escritas
    (SELECT COUNT(*) FROM books WHERE user_id = p_user_id AND review IS NOT NULL AND review != '') as reviews_written,
    -- Contar gêneros únicos lidos
    (SELECT COUNT(DISTINCT unnest(genres)) FROM books WHERE user_id = p_user_id AND status = 'completed') as genres_read,
    -- Verificar se leu mais de 500 páginas em um dia (aproximação)
    (SELECT CASE WHEN MAX(pages_read) > 500 THEN 1 ELSE 0 END FROM reading_sessions WHERE user_id = p_user_id) as pages_per_day,
    -- Verificar speed reader (livro completado no mesmo dia que começou a ler)
    (SELECT COUNT(*) FROM books WHERE user_id = p_user_id AND status = 'completed' 
     AND DATE(reading_started_at) = DATE(date_completed)) as speed_reader
  INTO user_stats
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  -- Se não encontrou perfil, criar stats zerados
  IF NOT FOUND THEN
    user_stats.books_completed := 0;
    user_stats.total_pages_read := 0;
    user_stats.current_streak := 0;
    user_stats.longest_streak := 0;
    user_stats.posts_created := 0;
    user_stats.likes_received := 0;
    user_stats.books_added := 0;
    user_stats.reviews_written := 0;
    user_stats.genres_read := 0;
    user_stats.pages_per_day := 0;
    user_stats.speed_reader := 0;
  END IF;

  -- Verificar cada conquista que o usuário ainda não desbloqueou
  FOR achievement IN
    SELECT a.id, a.title, a.description, a.icon, a.requirement_type, a.requirement_value
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Verificar se o usuário se qualifica para esta conquista
    IF (achievement.requirement_type = 'books_read' AND user_stats.books_completed >= achievement.requirement_value) OR
       (achievement.requirement_type = 'pages_read' AND user_stats.total_pages_read >= achievement.requirement_value) OR
       (achievement.requirement_type = 'streak_days' AND GREATEST(user_stats.current_streak, user_stats.longest_streak) >= achievement.requirement_value) OR
       (achievement.requirement_type = 'posts_created' AND user_stats.posts_created >= achievement.requirement_value) OR
       (achievement.requirement_type = 'likes_received' AND user_stats.likes_received >= achievement.requirement_value) OR
       (achievement.requirement_type = 'books_added' AND user_stats.books_added >= achievement.requirement_value) OR
       (achievement.requirement_type = 'reviews_written' AND user_stats.reviews_written >= achievement.requirement_value) OR
       (achievement.requirement_type = 'genres_read' AND user_stats.genres_read >= achievement.requirement_value) OR
       (achievement.requirement_type = 'pages_per_day' AND user_stats.pages_per_day >= achievement.requirement_value) OR
       (achievement.requirement_type = 'speed_reader' AND user_stats.speed_reader >= achievement.requirement_value) THEN
      
      -- Conceder a conquista
      INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (p_user_id, achievement.id, NOW())
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Retornar a conquista concedida
      SELECT achievement.id, achievement.title, achievement.description, achievement.icon
      INTO new_achievement;

      achievement_id := new_achievement.id;
      title := new_achievement.title;
      description := new_achievement.description;
      icon := new_achievement.icon;

      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para verificar conquistas automaticamente após mudanças relevantes
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar conquistas quando um livro é marcado como completado
  IF TG_TABLE_NAME = 'books' THEN
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
      PERFORM check_and_grant_achievements_enhanced(NEW.user_id);
    END IF;
  -- Verificar conquistas quando um post é criado
  ELSIF TG_TABLE_NAME = 'social_posts' THEN
    PERFORM check_and_grant_achievements_enhanced(NEW.user_id);
  -- Verificar conquistas quando uma sessão de leitura é adicionada
  ELSIF TG_TABLE_NAME = 'reading_sessions' THEN
    PERFORM check_and_grant_achievements_enhanced(NEW.user_id);
  -- Verificar conquistas quando o perfil é atualizado
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    PERFORM check_and_grant_achievements_enhanced(NEW.user_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas relevantes
DROP TRIGGER IF EXISTS check_achievements_on_book_completion ON books;
CREATE TRIGGER check_achievements_on_book_completion
  AFTER INSERT OR UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_post_creation ON social_posts;
CREATE TRIGGER check_achievements_on_post_creation
  AFTER INSERT ON social_posts
  FOR EACH ROW EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_reading_session ON reading_sessions;
CREATE TRIGGER check_achievements_on_reading_session
  AFTER INSERT ON reading_sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_profile_update ON profiles;
CREATE TRIGGER check_achievements_on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_check_achievements();