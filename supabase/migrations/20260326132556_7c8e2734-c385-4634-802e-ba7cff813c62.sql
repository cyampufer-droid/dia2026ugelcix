
-- Drop the purge trigger and function
DROP TRIGGER IF EXISTS trg_purge_old_login_logs ON public.login_logs;
DROP FUNCTION IF EXISTS public.purge_old_login_logs();

-- Drop RLS policies on login_logs
DROP POLICY IF EXISTS "Admins read login_logs" ON public.login_logs;
DROP POLICY IF EXISTS "Admins manage login_logs" ON public.login_logs;
DROP POLICY IF EXISTS "Users insert own login_log" ON public.login_logs;

-- Drop the login_logs table entirely
DROP TABLE IF EXISTS public.login_logs;
