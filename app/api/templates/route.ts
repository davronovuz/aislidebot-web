import { NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET() {
  try {
    const res = await fetch(`${BOT_API_URL}/api/templates`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: true, templates: [] });
  }
}
