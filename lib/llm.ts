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

// Tartib muhim — BEPUL provayderlar ASOSIY (user qarori: pullik OpenAI
// faqat eng oxirgi zaxira). Python llm_client.py bilan sinxron.
const PROVIDERS: Provider[] = [
  {
    name: 'groq-oss',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    model: 'openai/gpt-oss-120b',
    supportsJsonMode: true,
  },
  {
    name: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envKey: 'GEMINI_API_KEY',
    model: 'gemini-2.5-flash-lite',
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
  // Oxirgi zaxira — kvotasi bo'lsa ishlaydi, bo'lmasa o'tkazib yuboriladi
  { name: 'openai', envKey: 'OPENAI_API_KEY', model: 'gpt-4o-mini', supportsJsonMode: true },
];

const clients = new Map<string, OpenAI>();

// O'lik provayder cooldown'i (module-level: warm lambda'lar orasida saqlanadi).
// Muhim farq: 401/403 (kalit o'lik) — uzoq; 429 (rate limit, ko'pincha
// daqiqalik) — qisqa; 5xx (transient) — umuman cooldown YO'Q.
const deadUntil = new Map<string, number>();
const AUTH_COOLDOWN_MS = 30 * 60 * 1000; // 401/403 — kalit/kvota o'lik
// 429 — Groq/Gemini'da bu ko'pincha DAQIQALIK token limiti (TPM), 20-30s da
// tiklanadi. Uzoq cooldown eng yaxshi provayderni keraksiz chetlatadi.
const RATE_COOLDOWN_MS = 20 * 1000;

function getClient(p: Provider, apiKey: string): OpenAI {
  const key = `${p.name}`;
  if (!clients.has(key)) {
    // maxRetries: 0 — kvota 429 retry bilan tuzalmaydi, darhol keyingi provayderga
    clients.set(key, new OpenAI({ apiKey, baseURL: p.baseURL, timeout: 90_000, maxRetries: 0 }));
  }
  return clients.get(key)!;
}

function errStatus(err: unknown): number {
  return (err as { status?: number })?.status ?? 0;
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
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function llmChat({ messages, maxTokens = 2500, temperature = 0.6, jsonMode = false }: LlmChatParams): Promise<string> {
  let lastError: unknown = null;

  // 3 pass: transient xatolar (503 high demand, daqiqalik 429) bir necha
  // sekunddan keyin o'tib ketadi — butun so'rovni yiqitmasdan qayta urinamiz.
  // Oxirgi pass'da cooldown E'TIBORSIZ: hammasi cooldown'da bo'lsa ham,
  // urinmasdan yiqilishdan ko'ra urinib ko'rish afzal (75s eski 429
  // allaqachon o'tgan bo'lishi mumkin).
  for (let pass = 0; pass < 3; pass++) {
    // TPM limitlari ~daqiqalik oynada tiklanadi — pass orasi yetarlicha uzun
    if (pass > 0) await sleep(pass === 1 ? 6000 : 12000);
    const ignoreCooldown = pass === 2;

    for (const p of PROVIDERS) {
      const apiKey = process.env[p.envKey]?.trim();
      if (!apiKey) continue;
      const dead = deadUntil.get(p.name);
      if (!ignoreCooldown && dead && Date.now() < dead) continue;

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
        console.log(`[LLM] Provayder: ${p.name} (${p.model})`);
        return content;
      } catch (err) {
        lastError = err;
        const status = errStatus(err);
        if (status === 401 || status === 403) {
          deadUntil.set(p.name, Date.now() + AUTH_COOLDOWN_MS);
        } else if (status === 429) {
          deadUntil.set(p.name, Date.now() + RATE_COOLDOWN_MS);
        }
        // 5xx — cooldown yo'q: keyingi pass'da yana urinamiz
        console.warn(`[LLM] ${p.name} xato (pass ${pass + 1}): ${(err as Error).message?.slice(0, 150)}`);
      }
    }
  }

  throw new Error(`Barcha LLM provayderlar ishlamadi: ${(lastError as Error)?.message ?? 'kalit topilmadi'}`);
}
