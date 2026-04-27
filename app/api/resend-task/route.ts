import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BOT_API_URL}/api/resend-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server connection failed' }, { status: 500 });
  }
}
