// Neon PostgreSQL adapter — same API as supabase, different backend
import db from './db';

// Backward-compatible export (same signature as old createSupabaseAdminClient)
export const createSupabaseAdminClient = (_config?: any) => db;

export default db;
