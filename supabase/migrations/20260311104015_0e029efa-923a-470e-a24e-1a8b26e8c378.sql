-- Create public storage bucket for evaluation PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evaluaciones', 'evaluaciones', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for evaluaciones"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evaluaciones');

-- Allow authenticated upload
CREATE POLICY "Authenticated upload for evaluaciones"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evaluaciones');