import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const uuid = req.nextUrl.searchParams.get('uuid');
  if (!uuid) return NextResponse.json({ error: 'uuid required' }, { status: 400 });

  try {
    const res = await fetch(`${BOT_API_URL}/api/task-status/${uuid}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Could not fetch status' }, { status: 500 });
  }
}
