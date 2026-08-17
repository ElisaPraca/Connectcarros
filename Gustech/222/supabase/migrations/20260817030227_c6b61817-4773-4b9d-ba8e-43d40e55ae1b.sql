ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "checklist_photos_read" ON storage.objects;
CREATE POLICY "checklist_photos_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'checklist-photos');
DROP POLICY IF EXISTS "checklist_photos_insert" ON storage.objects;
CREATE POLICY "checklist_photos_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'checklist-photos');