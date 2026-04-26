import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data?.telegram_id) {
      return NextResponse.json({ error: 'telegram_id required' }, { status: 400 });
    }

    const response = await fetch(`${BOT_API_URL}/api/submit-presentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('submit-presentation proxy error:', err);
    return NextResponse.json({ error: 'Server connection failed. Please try again.' }, { status: 500 });
  }
}
