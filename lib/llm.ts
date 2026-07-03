/**
 * LLM fallback zanjiri — backend'dagi utils/llm_client.py bilan bir xil mantiq.
 * OpenAI 429/xato bersa bepul zahira provayderlarga avtomatik o'tadi.
 * Hammasi OpenAI-compatible endpointlar.
 *
 * Vercel env kalitlari: OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY
 * — qaysi biri bo'lsa o'sha zanjirda qatnashadi.
 */
import OpenAI from 'openai';

interface Provider {
  name: string;
  baseURL?: string;
  envKey: string;
  model: string;
  supportsJsonMode: boolean;
}

// Tartib muhim — sifat/ishonchlilik bo'yicha (Python llm_client.py bilan sinxron)
const PROVIDERS: Provider[] = [
  { name: 'openai', envKey: 'OPENAI_API_KEY', model: 'gpt-4o-mini', supportsJsonMode: true },
  {
    name: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envKey: 'GEMINI_API_KEY',
    model: 'gemini-2.5-flash-lite',
    supportsJsonMode: true,
  },
  {
    name: 'groq-oss',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    model: 'openai/gpt-oss-120b',
    supportsJsonMode: true,
  },
  {
    name: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
    supportsJsonMode: true,
  },
  {
    name: 'cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    envKey: 'CEREBRAS_API_KEY',
    model: 'gpt-oss-120b',
    supportsJsonMode: false,
  },
];

const clients = new Map<string, OpenAI>();

function getClient(p: Provider, apiKey: string): OpenAI {
  const key = `${p.name}`;
  if (!clients.has(key)) {
    clients.set(key, new OpenAI({ apiKey, baseURL: p.baseURL, timeout: 120_000, maxRetries: 1 }));
  }
  return clients.get(key)!;
}

function stripJsonFences(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : text.trim();
}

export interface LlmChatParams {
  messages: OpenAI.ChatCompletionMessageParam[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

/**
 * Provayder zanjiri bo'ylab chat so'rovi. Muvaffaqiyatli birinchi javob matnini qaytaradi.
 * jsonMode=true bo'lsa natija toza JSON string bo'lishi kafolatlanadi (fence'lar tozalanadi).
 */
export async function llmChat({ messages, maxTokens = 2500, temperature = 0.6, jsonMode = false }: LlmChatParams): Promise<string> {
  let lastError: unknown = null;

  for (const p of PROVIDERS) {
    const apiKey = process.env[p.envKey]?.trim();
    if (!apiKey) continue;

    try {
      const client = getClient(p, apiKey);
      const response = await client.chat.completions.create({
        model: p.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode && p.supportsJsonMode ? { response_format: { type: 'json_object' } } : {}),
      });
      let content = response.choices[0]?.message?.content ?? '';
      if (!content.trim()) throw new Error('empty response');
      if (jsonMode && !p.supportsJsonMode) content = stripJsonFences(content);
      if (jsonMode) JSON.parse(content); // validatsiya — buzuq JSON bo'lsa keyingi provayderga
      if (p.name !== 'openai') console.warn(`[LLM] Zahira provayder ishlatildi: ${p.name} (${p.model})`);
      return content;
    } catch (err) {
      lastError = err;
      console.warn(`[LLM] ${p.name} xato: ${(err as Error).message?.slice(0, 200)} — keyingisiga o'tamiz`);
    }
  }

  throw new Error(`Barcha LLM provayderlar ishlamadi: ${(lastError as Error)?.message ?? 'kalit topilmadi'}`);
}
