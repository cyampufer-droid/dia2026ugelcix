
-- Add is_pip column to profiles
ALTER TABLE public.profiles ADD COLUMN is_pip boolean NOT NULL DEFAULT false;

-- Migrate existing PIP docentes: set is_pip=true and clear their grado_seccion_id
UPDATE public.profiles p
SET is_pip = true, grado_seccion_id = null
FROM public.niveles_grados ng, public.user_roles ur
WHERE p.grado_seccion_id = ng.id
  AND ng.seccion = 'PIP'
  AND ur.user_id = p.user_id
  AND ur.role = 'docente';

-- Update the is_pip_docente function to check profiles.is_pip
CREATE OR REPLACE FUNCTION public.is_pip_docente(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND ur.role = 'docente'
      AND p.is_pip = true
  )
$$;
