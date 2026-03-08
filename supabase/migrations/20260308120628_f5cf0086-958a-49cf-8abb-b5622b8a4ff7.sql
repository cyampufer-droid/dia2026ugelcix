
-- Add last_seen to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;

-- Create login_logs table
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nombre_completo text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  logged_in_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all login logs
CREATE POLICY "Admins read login_logs" ON public.login_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- Admin can manage all login logs
CREATE POLICY "Admins manage login_logs" ON public.login_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- Any authenticated user can insert their own log
CREATE POLICY "Users insert own login_log" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_in_at ON public.login_logs(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC NULLS LAST);
