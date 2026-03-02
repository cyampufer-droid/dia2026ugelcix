
-- Allow directors/subdirectors to read ALL instituciones (needed for selection)
CREATE POLICY "Directors read all instituciones for selection"
ON public.instituciones
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'subdirector'::app_role)
);

-- Allow directors/subdirectors to update their own profile (to set institucion_id)
CREATE POLICY "Directors update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND 
  (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'subdirector'::app_role))
)
WITH CHECK (
  user_id = auth.uid() AND 
  (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'subdirector'::app_role))
);
