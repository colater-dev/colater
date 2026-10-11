/** Server-side R2 upload of raw bytes (never import from client components). */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from './r2';

export function extensionForContentType(contentType: string): string {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'png';
}

export async function uploadBufferToR2(buffer: Buffer, contentType: string, keyPrefix: string): Promise<string> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) throw new Error('R2 is not configured');
  const key = `${keyPrefix}/${randomUUID()}.${extensionForContentType(contentType)}`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType }));
  return `${R2_PUBLIC_URL}/${key}`;
}
