import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const workId = fd.get('work_id');
    if (!workId) {
      return NextResponse.json({ error: 'work_id required' }, { status: 400 });
    }
    const res = await fetch(`${BOT_API_URL}/api/admin/works/${workId}/moderate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_SECRET}` },
      body: fd,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server connection failed' }, { status: 500 });
  }
}
