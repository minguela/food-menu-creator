-- ============================================
-- Migración: Storage Bucket para imágenes
-- ============================================

-- Crear bucket para imágenes de menús
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: permitir lectura pública
CREATE POLICY "Permitir lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Política: permitir subida a usuarios autenticados
CREATE POLICY "Permitir subida autenticada"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Política: permitir eliminación al dueño
CREATE POLICY "Permitir eliminación al dueño"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND owner = auth.uid());
