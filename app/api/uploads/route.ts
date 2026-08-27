import { put } from '@vercel/blob';
import { getChatGPTUser } from '../../chatgpt-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

  const data = await request.formData();
  const file = data.get('photo');
  if (!(file instanceof File)) return Response.json({ error: 'Photo required' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return Response.json({ error: 'Use a JPG, PNG, or WebP image' }, { status: 415 });
  if (file.size > 4 * 1024 * 1024) return Response.json({ error: 'Photo must be under 4 MB' }, { status: 413 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'Photo uploads are not configured yet' }, { status: 503 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
  const key = `view-uploads/${user.userId}/${crypto.randomUUID()}-${safeName}`;
  const blob = await put(key, file, { access: 'public' });
  return Response.json({ ok: true, key: blob.url });
}
