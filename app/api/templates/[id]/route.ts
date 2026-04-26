import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await fetch(`${BOT_API_URL}/api/templates/${id}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
