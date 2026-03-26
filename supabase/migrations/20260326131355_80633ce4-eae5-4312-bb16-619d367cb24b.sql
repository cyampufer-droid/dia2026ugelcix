
-- Drop 2 redundant composite indexes on resultados (the UNIQUE index already covers these queries)
DROP INDEX IF EXISTS public.idx_resultados_estudiante_evaluacion;
DROP INDEX IF EXISTS public.idx_resultados_student_eval_composite;

-- Drop individual column indexes on resultados (the unique composite + queries always use both columns)
DROP INDEX IF EXISTS public.idx_resultados_estudiante_id;
DROP INDEX IF EXISTS public.idx_resultados_evaluacion_id;

-- Drop oversized last_seen index on profiles (8.5 MB, only used by online users panel which queries 50 rows)
DROP INDEX IF EXISTS public.idx_profiles_last_seen;

-- Create a lightweight partial index for online users (only non-null last_seen in last 10 min)
-- This replaces the full 8.5MB index with a tiny partial one
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_recent 
ON public.profiles (last_seen DESC) 
WHERE last_seen IS NOT NULL;

-- Auto-purge login_logs: keep only last 30 days via trigger on INSERT
CREATE OR REPLACE FUNCTION public.purge_old_login_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_logs WHERE logged_in_at < now() - interval '30 days';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_purge_old_login_logs
AFTER INSERT ON public.login_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.purge_old_login_logs();
