import { issueSignedToken, presignUrl } from '@vercel/blob';

const PRIVATE_BLOB_HOST = process.env.BLOB_STORE_HOST || 'gtdpmnxn5yj6h8eu.private.blob.vercel-storage.com';
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

function pathnameFromPrivateBlobUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== PRIVATE_BLOB_HOST || !url.pathname || url.pathname === '/') {
    return null;
  }
  return url.pathname.slice(1).split('/').map((segment) => decodeURIComponent(segment)).join('/');
}

export async function signPrivateBlobUrl(value: unknown): Promise<string | null> {
  const pathname = pathnameFromPrivateBlobUrl(value);
  if (!pathname) return null;

  const validUntil = Date.now() + SIGNED_URL_TTL_MS;
  const token = await issueSignedToken({ pathname, operations: ['get'], validUntil });
  const { presignedUrl } = await presignUrl(token, {
    access: 'private',
    operation: 'get',
    pathname,
    validUntil,
  });
  return presignedUrl;
}

export async function signImageUrls<T extends Record<string, unknown>>(table: string, rows: T | T[] | null): Promise<T | T[] | null> {
  if (!rows || !['weekly_meals', 'weekly_day_images', 'menu_images'].includes(table)) return rows;
  const list = Array.isArray(rows) ? rows : [rows];
  const signed = await Promise.all(list.map(async (row) => {
    if (!row.image_url) return row;
    const imageUrl = await signPrivateBlobUrl(row.image_url);
    return imageUrl ? { ...row, image_url: imageUrl } : row;
  }));
  return Array.isArray(rows) ? signed : signed[0];
}
