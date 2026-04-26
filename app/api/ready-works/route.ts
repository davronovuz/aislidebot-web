import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const type = req.nextUrl.searchParams.get('type') ?? '';

  try {
    const url = new URL(`${BOT_API_URL}/api/ready-works`);
    if (q) url.searchParams.set('q', q);
    if (type) url.searchParams.set('type', type);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: true, works: [] });
  }
}
