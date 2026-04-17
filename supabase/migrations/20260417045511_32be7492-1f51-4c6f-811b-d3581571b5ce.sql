
-- Drop any existing permissive policies on storage.objects for the evaluaciones bucket
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%evaluaciones%'
        OR policyname IN (
          'Authenticated can upload to evaluaciones',
          'Authenticated upload evaluaciones',
          'Anyone can upload evaluaciones',
          'Public can upload evaluaciones'
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Public read access (bucket is public)
CREATE POLICY "Evaluaciones public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evaluaciones');

-- Only admins and especialistas can upload
CREATE POLICY "Evaluaciones admin/especialista insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evaluaciones'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'especialista'::public.app_role)
  )
);

-- Only admins and especialistas can update
CREATE POLICY "Evaluaciones admin/especialista update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evaluaciones'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'especialista'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'evaluaciones'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'especialista'::public.app_role)
  )
);

-- Only admins and especialistas can delete
CREATE POLICY "Evaluaciones admin/especialista delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evaluaciones'
  AND (
    public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'especialista'::public.app_role)
  )
);
