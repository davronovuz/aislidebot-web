import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_MAP: Record<string, string> = {
  uz: "O'zbek tilida",
  ru: 'На русском языке',
  en: 'In English',
};

export async function POST(req: NextRequest) {
  try {
    const { topic, slideTitle, slideNumber, totalSlides, language, keyPoints, presentationTitle } =
      await req.json();

    if (!topic || !slideTitle) {
      return NextResponse.json({ error: 'topic and slideTitle required' }, { status: 400 });
    }

    const langInstruction = LANG_MAP[language] ?? LANG_MAP.uz;
    const isIntro = slideNumber === 1;
    const isConclusion = slideNumber === totalSlides;

    let slideRole = 'a CONTENT slide — deep, specific information with examples and data';
    if (isIntro) slideRole = 'the OPENING slide — hook the audience, explain why this topic matters';
    if (isConclusion) slideRole = 'the CLOSING slide — summarize insights, actionable takeaways, strong statement';

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a world-class presentation content writer. Create rich, informative slide content. Write ${langInstruction}. Only image_keywords in English.`,
        },
        {
          role: 'user',
          content: `Presentation: "${presentationTitle}"
Topic: ${topic}
Slide ${slideNumber}/${totalSlides} — this is ${slideRole}.
Title: "${slideTitle}"
Points to cover: ${JSON.stringify(keyPoints ?? [])}

Return JSON:
{
  "title": "Clear specific title 4-8 words — ${langInstruction}",
  "content": "3-4 informative sentences with specific facts/data — ${langInstruction}",
  "bullet_points": [
    "Point 1 — 15-25 words with specific fact or number — ${langInstruction}",
    "Point 2 — different angle with concrete data",
    "Point 3 — real-world application or example",
    "Point 4 — unique insight or actionable takeaway"
  ],
  "image_keywords": {
    "primary": "specific photographable scene 3-4 words ENGLISH",
    "secondary": "related real scene 2-3 words ENGLISH",
    "fallback": "simple category word ENGLISH"
  }
}

RULES:
- content: 3-4 INFORMATIVE sentences with REAL substance
- bullet_points: exactly 4, each 15-25 words, DIFFERENT aspects
- Include numbers, percentages, company names, research sources where relevant
- BAD: "AI rivojlanmoqda" — GOOD: "GPT-4 2023 yilda 100M+ foydalanuvchiga yetdi"
- image primary: REAL photo scene directly for "${slideTitle}" — NOT "technology" or "business"`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content ?? '{}');
    return NextResponse.json(content);
  } catch (err) {
    console.error('generate-slide error:', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Slide generation failed' }, { status: 500 });
  }
}
