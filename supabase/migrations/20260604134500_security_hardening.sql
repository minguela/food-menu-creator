-- Security hardening for public RPCs and storage policies.

REVOKE EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) TO service_role;

DROP POLICY IF EXISTS "Permitir subida autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación al dueño" ON storage.objects;

CREATE POLICY "Permitir subida autenticada"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Permitir eliminación autenticada"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND owner = auth.uid());
