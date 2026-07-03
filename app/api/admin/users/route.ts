import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const telegramId = sp.get('telegram_id');
  if (!telegramId) {
    return NextResponse.json({ error: 'telegram_id required' }, { status: 400 });
  }
  try {
    const url = new URL(`${BOT_API_URL}/api/v1/admin-web/users`);
    url.searchParams.set('telegram_id', telegramId);
    if (sp.get('q')) url.searchParams.set('q', sp.get('q')!);
    if (sp.get('offset')) url.searchParams.set('offset', sp.get('offset')!);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_SECRET}` }, cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, users: [] }, { status: 500 });
  }
}
