-- Script para inserir conquistas de exemplo no ReadQuest
-- Execute este script no Supabase SQL Editor se não houver conquistas cadastradas

-- Inserir conquistas básicas (se não existirem)
INSERT INTO public.achievements (title, description, icon, requirement_type, requirement_value, rarity)
VALUES 
  ('Primeira Leitura', 'Complete seu primeiro livro', '📖', 'books_read', 1, 'common'),
  ('Leitor Iniciante', 'Complete 5 livros', '📚', 'books_read', 5, 'common'),
  ('Leitor Dedicado', 'Complete 10 livros', '🎯', 'books_read', 10, 'uncommon'),
  ('Leitor Experiente', 'Complete 25 livros', '⭐', 'books_read', 25, 'rare'),
  ('Bibliófilo', 'Complete 50 livros', '🏆', 'books_read', 50, 'epic'),
  ('Mestre dos Livros', 'Complete 100 livros', '👑', 'books_read', 100, 'legendary'),
  
  ('Primeiras Páginas', 'Leia 100 páginas', '📄', 'pages_read', 100, 'common'),
  ('Maratonista', 'Leia 1.000 páginas', '🏃', 'pages_read', 1000, 'uncommon'),
  ('Devorador de Páginas', 'Leia 5.000 páginas', '🔥', 'pages_read', 5000, 'rare'),
  ('Leitor Insaciável', 'Leia 10.000 páginas', '💫', 'pages_read', 10000, 'epic'),
  
  ('Sequência Iniciada', 'Mantenha uma sequência de 3 dias', '🔥', 'streak', 3, 'common'),
  ('Uma Semana Forte', 'Mantenha uma sequência de 7 dias', '⭐', 'streak', 7, 'uncommon'),
  ('Mês Completo', 'Mantenha uma sequência de 30 dias', '🎯', 'streak', 30, 'rare'),
  ('Trimestre Lendário', 'Mantenha uma sequência de 90 dias', '💎', 'streak', 90, 'epic')
ON CONFLICT (id) DO NOTHING;

-- Verificar conquistas inseridas
SELECT id, title, description, icon, requirement_type, requirement_value, rarity
FROM public.achievements
ORDER BY requirement_value;
