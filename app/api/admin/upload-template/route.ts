import { NextRequest, NextResponse } from 'next/server';
import { BOT_API_URL, API_SECRET } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 300; // template upload + LibreOffice render can take a while

export async function POST(req: NextRequest) {
  try {
    // Forward multipart form-data to bot API
    const fd = await req.formData();
    const res = await fetch(`${BOT_API_URL}/api/admin/upload-template`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_SECRET}` },
      body: fd,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('upload-template proxy error:', e);
    return NextResponse.json({ error: 'Server connection failed' }, { status: 500 });
  }
}
