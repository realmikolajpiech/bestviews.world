import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { communityTips, userViewStates, viewpointSubmissions } from '../../../db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action || '');
  const db = getDb();
  const now = Date.now();

  if (action === 'save' || action === 'visit') {
    const viewSlug = String(body.viewSlug || '');
    if (!viewSlug) return Response.json({ error: 'Missing viewpoint' }, { status: 400 });
    const id = `${user.userId}:${viewSlug}`;
    const value = Boolean(body.value);
    await db.insert(userViewStates).values({
      id,
      userId: user.userId,
      viewSlug,
      saved: action === 'save' ? value : false,
      visited: action === 'visit' ? value : false,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: userViewStates.id,
      set: action === 'save' ? { saved: value, updatedAt: now } : { visited: value, updatedAt: now },
    });
    return Response.json({ ok: true });
  }

  if (action === 'tip') {
    const viewSlug = String(body.viewSlug || '');
    const tip = String(body.body || '').trim();
    if (!viewSlug || tip.length < 4 || tip.length > 280) return Response.json({ error: 'Tip must be 4–280 characters' }, { status: 400 });
    await db.insert(communityTips).values({ id: crypto.randomUUID(), userId: user.userId, viewSlug, body: tip, createdAt: now });
    return Response.json({ ok: true });
  }

  if (action === 'submit') {
    const title = String(body.title || '').trim();
    const coordinates = String(body.coordinates || '').trim();
    if (!title || !coordinates) return Response.json({ error: 'Name and coordinates are required' }, { status: 400 });
    await db.insert(viewpointSubmissions).values({
      id: crypto.randomUUID(), userId: user.userId, title, coordinates,
      lookDirection: body.lookDirection ? String(body.lookDirection) : null,
      photoKey: body.photoKey ? String(body.photoKey) : null,
      status: 'pending', createdAt: now,
    });
    return Response.json({ ok: true, status: 'pending' });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
