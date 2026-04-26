import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get('telegram_id');
  if (!telegramId) return NextResponse.json({ error: 'telegram_id required' }, { status: 400 });

  try {
    const res = await fetch(`${BOT_API_URL}/api/user-info?telegram_id=${telegramId}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server connection failed' }, { status: 500 });
  }
}
