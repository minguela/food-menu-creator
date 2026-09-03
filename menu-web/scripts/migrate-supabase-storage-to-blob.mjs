import { readFileSync, writeFileSync } from 'node:fs';
import { Pool } from 'pg';
import { list, put } from '@vercel/blob';

const SOURCE_BUCKET = 'menu-images';
const TARGET_HOST = process.env.BLOB_STORE_HOST || 'gtdpmnxn5yj6h8eu.private.blob.vercel-storage.com';
const TARGET_BASE_URL = `https://${TARGET_HOST}`;
const sourceEnvFile = process.env.MIGRATION_ENV_FILE || '/private/tmp/menu-planner-migration.XDmTXB/production.env';

function parseEnvFile(filePath) {
  const values = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    let value = line.slice(separator + 1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    values[line.slice(0, separator)] = value;
  }
  return values;
}

const sourceEnv = parseEnvFile(sourceEnvFile);
const sourceUrl = (sourceEnv.NUXT_PUBLIC_SUPABASE_URL || sourceEnv.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const sourceKey = sourceEnv.NUXT_PUBLIC_SUPABASE_ANON_KEY || sourceEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!sourceUrl || !sourceKey) throw new Error('Supabase public source configuration is missing');
if (!databaseUrl) throw new Error('NEON_DATABASE_URL is missing');
if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
  throw new Error('Vercel Blob credentials are missing');
}

const headers = {
  apikey: sourceKey,
  Authorization: `Bearer ${sourceKey}`,
  'content-type': 'application/json',
};

async function listSourcePrefix(prefix) {
  const objects = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${sourceUrl}/storage/v1/object/list/${SOURCE_BUCKET}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prefix,
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      }),
    });
    if (!response.ok) throw new Error(`Source storage listing failed (${response.status})`);
    const page = await response.json();
    objects.push(...page);
    if (page.length < 1000) return objects;
  }
}

async function listSourceObjects() {
  const files = [];
  const pendingPrefixes = [''];
  while (pendingPrefixes.length) {
    const prefix = pendingPrefixes.shift();
    const entries = await listSourcePrefix(prefix);
    for (const entry of entries) {
      const pathname = prefix + entry.name;
      if (entry.id) files.push({
        pathname,
        size: Number(entry.metadata?.size || 0),
        contentType: entry.metadata?.mimetype || 'application/octet-stream',
      });
      else pendingPrefixes.push(`${pathname}/`);
    }
  }
  return files.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

function sourceObjectUrl(pathname) {
  const encodedPath = pathname.split('/').map(encodeURIComponent).join('/');
  return `${sourceUrl}/storage/v1/object/public/${SOURCE_BUCKET}/${encodedPath}`;
}

function targetObjectUrl(pathname) {
  return `${TARGET_BASE_URL}/${pathname.split('/').map(encodeURIComponent).join('/')}`;
}

async function downloadSourceObject(object) {
  const response = await fetch(sourceObjectUrl(object.pathname), {
    headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
  });
  if (!response.ok) throw new Error(`Source object download failed (${response.status}) for ${object.pathname}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (object.size && body.byteLength !== object.size) {
    throw new Error(`Source object size mismatch for ${object.pathname}: expected ${object.size}, got ${body.byteLength}`);
  }
  return body;
}

function sourcePathFromImageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  let parsed;
  try { parsed = new URL(value); } catch { return null; }
  if (parsed.hostname !== new URL(sourceUrl).hostname) return null;
  const marker = `/storage/v1/object/public/${SOURCE_BUCKET}/`;
  const markerIndex = parsed.pathname.indexOf(marker);
  if (markerIndex < 0) return null;
  return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
}

async function updateImageReferences(pool, sourcePathnames) {
  const sourcePaths = new Set(sourcePathnames);
  const updates = [];
  await pool.query('BEGIN');
  try {
    for (const table of ['weekly_meals', 'weekly_day_images']) {
      const result = await pool.query(`SELECT id, image_url FROM "${table}" WHERE image_url IS NOT NULL`);
      for (const row of result.rows) {
        const pathname = sourcePathFromImageUrl(row.image_url);
        if (!pathname) continue;
        if (!sourcePaths.has(pathname)) throw new Error(`Referenced source object is missing: ${pathname}`);
        const imageUrl = targetObjectUrl(pathname);
        await pool.query(`UPDATE "${table}" SET image_url = $1 WHERE id = $2`, [imageUrl, row.id]);
        updates.push({ table, id: row.id });
      }
    }
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
  return updates;
}

const sourceObjects = await listSourceObjects();
if (sourceObjects.length !== 58) {
  throw new Error(`Expected 58 source image objects, found ${sourceObjects.length}`);
}

let uploadedBytes = 0;
for (let index = 0; index < sourceObjects.length; index++) {
  const object = sourceObjects[index];
  const body = await downloadSourceObject(object);
  await put(object.pathname, body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: object.contentType,
    cacheControlMaxAge: 31536000,
  });
  uploadedBytes += body.byteLength;
  console.log(`Uploaded ${index + 1}/${sourceObjects.length}`);
}

const blobObjects = [];
for (let cursor; ;) {
  const page = await list({ limit: 1000, cursor });
  blobObjects.push(...page.blobs);
  if (!page.hasMore) break;
  cursor = page.cursor;
}
const sourcePathnames = sourceObjects.map((object) => object.pathname);
const targetPathnames = blobObjects.map((object) => object.pathname).sort();
if (targetPathnames.length !== sourcePathnames.length || targetPathnames.some((path, index) => path !== sourcePathnames[index])) {
  throw new Error(`Blob verification failed: expected ${sourcePathnames.length} objects, found ${targetPathnames.length}`);
}

const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 2 });
const updates = await updateImageReferences(pool, sourcePathnames);
const remainingSourceUrls = await pool.query(`
  SELECT count(*)::int AS count
  FROM (
    SELECT image_url FROM weekly_meals WHERE image_url IS NOT NULL
    UNION ALL
    SELECT image_url FROM weekly_day_images WHERE image_url IS NOT NULL
  ) images
  WHERE image_url LIKE $1
`, [`${sourceUrl}/%`]);
await pool.end();

if (remainingSourceUrls.rows[0].count !== 0) {
  throw new Error(`Neon still contains ${remainingSourceUrls.rows[0].count} source image URLs`);
}

const manifest = {
  bucket: SOURCE_BUCKET,
  sourceObjectCount: sourceObjects.length,
  blobObjectCount: blobObjects.length,
  uploadedBytes,
  updatedImageReferences: updates.length,
  targetHost: TARGET_HOST,
};
const manifestPath = process.env.STORAGE_MIGRATION_MANIFEST || '/private/tmp/menu-planner-storage-migration-manifest.json';
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(`Storage migration committed; objects=${blobObjects.length}; references=${updates.length}; bytes=${uploadedBytes}; manifest=${manifestPath}`);
