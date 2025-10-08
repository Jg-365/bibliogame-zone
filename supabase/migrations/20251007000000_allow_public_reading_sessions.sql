-- Allow users to view reading sessions from all users (public information)
DROP POLICY IF EXISTS "Users can view their reading sessions" ON public.reading_sessions;

CREATE POLICY "Anyone can view reading sessions" 
  ON public.reading_sessions 
  FOR SELECT 
  USING (true);

-- Keep the other policies for insert/update/delete (only own sessions)
