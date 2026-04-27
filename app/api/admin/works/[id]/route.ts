import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tid = req.nextUrl.searchParams.get('telegram_id');
    if (!tid) return NextResponse.json({ error: 'telegram_id required' }, { status: 400 });
    const res = await fetch(
      `${BOT_API_URL}/api/admin/works/${id}?telegram_id=${tid}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${API_SECRET}` } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server connection failed' }, { status: 500 });
  }
}
