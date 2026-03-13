-- Migration: MT-2 — user_achievement_progress view
-- Replaces 3 client-side queries in useAchievements with a single server-side join.
--
-- The view joins `achievements` with `user_achievements` for the currently
-- authenticated user (auth.uid()). Row-level security will still apply on the
-- underlying tables; this view is queried with SELECT permissions from the
-- anon/authenticated roles.

CREATE OR REPLACE VIEW public.user_achievement_progress AS
SELECT
  a.id,
  a.name,
  a.description,
  a.icon,
  a.requirement_type,
  a.requirement_value,
  a.points,
  a.created_at,
  -- expose camelCase aliases the client already uses
  a.requirement_type   AS "requirementType",
  a.requirement_value  AS "requirementValue",
  -- user progress columns (NULL when not yet unlocked)
  ua.id                AS user_achievement_id,
  ua.user_id,
  ua.unlocked_at,
  -- convenience boolean flag
  (ua.id IS NOT NULL)  AS unlocked
FROM public.achievements a
LEFT JOIN public.user_achievements ua
  ON ua.achievement_id = a.id
 AND ua.user_id = auth.uid()
ORDER BY a.requirement_value ASC;

-- Grant read access to authenticated users
GRANT SELECT ON public.user_achievement_progress TO authenticated;

COMMENT ON VIEW public.user_achievement_progress IS
  'Joins all achievements with the current user''s unlock status in a single query.';
