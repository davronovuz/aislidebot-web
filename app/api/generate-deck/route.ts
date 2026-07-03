import { NextRequest, NextResponse } from 'next/server';
import { llmChat } from '@/lib/llm';

export const maxDuration = 60;

const LANG_MAP: Record<string, string> = {
  uz: "O'zbek tilida",
  ru: 'На русском языке',
  en: 'In English',
};

/**
 * Butun prezentatsiyani BITTA LLM chaqiruvida yaratadi.
 * Eski oqim (1 outline + N slayd = N+1 so'rov) bepul provayderlarning
 * daqiqalik limitlariga urilardi. Bitta so'rov = limit muammosi deyarli yo'q.
 */
export async function POST(req: NextRequest) {
  try {
    const { topic, details, slideCount, language } = await req.json();
    if (!topic || !slideCount) {
      return NextResponse.json({ error: 'topic and slideCount required' }, { status: 400 });
    }
    const n = Math.min(Math.max(Number(slideCount) || 5, 3), 20);
    const langInstruction = LANG_MAP[language] ?? LANG_MAP.uz;

    const raw = await llmChat({
      jsonMode: true,
      maxTokens: Math.min(1200 + n * 650, 14000),
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: `You are a world-class presentation writer. Create a COMPLETE presentation in ONE response. All text content ${langInstruction}. Only image_keywords in English. Respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: `Create a complete ${n}-slide presentation.

TOPIC: ${topic}
ADDITIONAL CONTEXT: ${details || 'None'}

Return JSON:
{
  "title": "Compelling presentation title (5-10 words) — ${langInstruction}",
  "subtitle": "One sentence hook — ${langInstruction}",
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide title 4-8 words — ${langInstruction}",
      "content": "3-4 informative sentences with specific facts — ${langInstruction}",
      "bullet_points": [
        "Point 1 — 15-25 words with a specific fact or number — ${langInstruction}",
        "Point 2 — different angle with concrete data",
        "Point 3 — real-world application or example",
        "Point 4 — unique insight or takeaway"
      ],
      "notes": "Speaker notes 2-3 sentences — ${langInstruction}",
      "image_keywords": {
        "primary": "specific photographable scene 3-4 words ENGLISH",
        "secondary": "related real scene 2-3 words ENGLISH",
        "fallback": "simple category word ENGLISH"
      }
    }
  ]
}

RULES:
- EXACTLY ${n} slides. Slide 1 = opening hook. Last slide = conclusions + takeaways.
- Every content slide: AT LEAST 2 CONCRETE facts (numbers, years, names, places).
- FORBIDDEN: generic filler like "very important", "plays a big role".
- No idea repeated across slides — each slide covers a DIFFERENT aspect.
- bullet_points: exactly 4 per slide.
- image primary: REAL photographable scene, NOT abstract words.`,
        },
      ],
    });

    const content = JSON.parse(raw);
    if (!Array.isArray(content.slides) || content.slides.length === 0) {
      return NextResponse.json({ error: 'Empty deck generated' }, { status: 502 });
    }
    return NextResponse.json(content);
  } catch (err) {
    console.error('generate-deck error:', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Deck generation failed' }, { status: 500 });
  }
}
