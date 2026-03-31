-- Add composite index for the RLS subquery pattern used in docente_grados policies
CREATE INDEX IF NOT EXISTS idx_profiles_institucion_user_id ON public.profiles (institucion_id, user_id) WHERE user_id IS NOT NULL;

-- Add index on user_roles for faster has_role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- Analyze tables to update query planner statistics
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.docente_grados;
ANALYZE public.niveles_grados;