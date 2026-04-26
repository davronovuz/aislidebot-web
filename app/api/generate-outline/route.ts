import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_MAP: Record<string, string> = {
  uz: "O'zbek tilida yozing",
  ru: 'Пишите на русском языке',
  en: 'Write in English',
};

export async function POST(req: NextRequest) {
  try {
    const { topic, details, slideCount, language } = await req.json();
    if (!topic || !slideCount) {
      return NextResponse.json({ error: 'topic and slideCount required' }, { status: 400 });
    }

    const langInstruction = LANG_MAP[language] ?? LANG_MAP.uz;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a top-tier presentation strategist. Create outlines that tell a compelling story — each slide builds on the previous one. Respond only in valid JSON. All text content: ${langInstruction}. Only image_hint in English.`,
        },
        {
          role: 'user',
          content: `Create a ${slideCount}-slide presentation outline.

TOPIC: ${topic}
ADDITIONAL CONTEXT: ${details || 'None'}

Return JSON:
{
  "title": "Compelling title (5-10 words) — ${langInstruction}",
  "subtitle": "One sentence hook — ${langInstruction}",
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide title (4-8 words) — ${langInstruction}",
      "key_points": ["specific point 10-20 words", "another concrete point", "third actionable point"],
      "image_hint": "specific real-world scene 3-4 words ENGLISH"
    }
  ]
}

RULES:
- Slide 1 = Opening hook (why this matters NOW)
- Slides 2-${slideCount - 1} = Each covers ONE specific aspect (stats, examples, case studies)
- Last slide = Key takeaways + call to action
- No repetition between slides — each MUST have a different angle
- Slide titles MUST be specific, not generic
- key_points: 3 per slide, 10-20 words each, include numbers/names/years where relevant
- image_hint: must be a REAL photographable scene (NOT "technology", "business")

Create exactly ${slideCount} slides.`,
        },
      ],
      max_tokens: 2500,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content ?? '{}');
    return NextResponse.json(content);
  } catch (err) {
    console.error('generate-outline error:', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Generation failed' }, { status: 500 });
  }
}
