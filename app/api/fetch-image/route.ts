import { NextRequest, NextResponse } from 'next/server';

const PIXABAY_KEY = process.env.PIXABAY_API_KEY ?? '';

async function searchPixabay(query: string): Promise<{ url: string; thumb: string } | null> {
  if (!PIXABAY_KEY) return null;
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true&min_width=800`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const hit = data.hits?.[0];
    if (!hit) return null;
    return { url: hit.largeImageURL, thumb: hit.previewURL };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json();
    if (!keywords) return NextResponse.json({ url: null, thumb: null });

    const { primary, secondary, fallback } = keywords;

    let result = await searchPixabay(primary);
    if (!result) result = await searchPixabay(secondary);
    if (!result) result = await searchPixabay(fallback);

    return NextResponse.json(result ?? { url: null, thumb: null });
  } catch (err) {
    console.error('fetch-image error:', err);
    return NextResponse.json({ url: null, thumb: null });
  }
}
