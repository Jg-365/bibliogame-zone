# Instruções para Executar a Correção no Supabase Dashboard

Como a migração via CLI está apresentando conflitos, execute o SQL abaixo
diretamente no **Supabase Dashboard**.

## Como fazer:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto "bibliogame-zone"
3. Vá para **SQL Editor** (ícone de banco de dados na lateral)
4. Clique em **"New Query"**
5. Cole o código SQL abaixo e clique em **"Run"**

## SQL para executar:

```sql
-- =====================================================
-- CORREÇÃO DOS NOMES DOS CAMPOS DE STREAK
-- =====================================================

-- 1. Corrigir função de atualização de streak
CREATE OR REPLACE FUNCTION update_reading_streak_on_session()
RETURNS TRIGGER AS $$
DECLARE
  last_activity_date DATE;
  current_streak_val INTEGER;
  best_streak_val INTEGER;
BEGIN
  -- Get current profile data using correct field names
  SELECT last_activity_date, current_streak, longest_streak
  INTO last_activity_date, current_streak_val, best_streak_val
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Only update if this is a new day
  IF last_activity_date != CURRENT_DATE THEN
    IF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day - continue streak
      current_streak_val := current_streak_val + 1;
    ELSE
      -- Streak broken or new streak
      current_streak_val := 1;
    END IF;

    -- Update best streak if current streak is higher
    IF current_streak_val > best_streak_val THEN
      best_streak_val := current_streak_val;
    END IF;

    -- Update profile with correct field names
    UPDATE public.profiles
    SET
      current_streak = current_streak_val,
      longest_streak = best_streak_val,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS update_streak_on_reading_session ON public.reading_sessions;
CREATE TRIGGER update_streak_on_reading_session
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_streak_on_session();

-- 3. Corrigir função de verificação de streaks quebrados
CREATE OR REPLACE FUNCTION check_broken_streaks()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    current_streak = 0,
    updated_at = NOW()
  WHERE
    last_activity_date < CURRENT_DATE - INTERVAL '1 day'
    AND current_streak > 0;
END;
$$ LANGUAGE plpgsql;

-- 4. Corrigir função de conquistas
CREATE OR REPLACE FUNCTION check_and_grant_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
BEGIN
  -- Get current user stats with correct field names
  SELECT
    COALESCE(p.books_completed, 0) as books_completed,
    COALESCE(p.total_pages_read, 0) as total_pages_read,
    COALESCE(p.current_streak, 0) as current_streak,
    COALESCE(p.longest_streak, 0) as longest_streak
  INTO user_stats
  FROM profiles p
  WHERE p.user_id = p_user_id;

  -- If no profile found, skip
  IF NOT FOUND THEN
    user_stats.books_completed := 0;
    user_stats.total_pages_read := 0;
    user_stats.current_streak := 0;
    user_stats.longest_streak := 0;
  END IF;

  -- Check each achievement
  FOR achievement IN
    SELECT a.id, a.title, a.requirement_type, a.requirement_value
    FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Check if user qualifies for this achievement
    IF (achievement.requirement_type = 'books_read' AND user_stats.books_completed >= achievement.requirement_value) OR
       (achievement.requirement_type = 'pages_read' AND user_stats.total_pages_read >= achievement.requirement_value) OR
       (achievement.requirement_type = 'streak_days' AND GREATEST(user_stats.current_streak, user_stats.longest_streak) >= achievement.requirement_value) THEN

      -- Grant the achievement
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (p_user_id, achievement.id, NOW())
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Após executar o SQL:

1. ✅ O sistema de streak será corrigido
2. ✅ Os triggers funcionarão com os nomes corretos dos campos
3. ✅ As estatísticas do usuário aparecerão corretamente
4. ✅ Teste usando os botões de debug no dashboard do app

## Verificação:

Depois de executar, teste criando uma sessão de leitura para ver se:

- As estatísticas são atualizadas automaticamente
- O streak funciona corretamente
- As conquistas são desbloqueadas

Se algum erro ocorrer, copie a mensagem de erro e informe.
