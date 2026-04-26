import type { ProductMeta, Theme, LanguageMeta, PlanDetails } from '@/types';

export const LANGUAGES: LanguageMeta[] = [
  { id: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

export const THEMES: Theme[] = [
  { id: 'chisel',     name: 'Minimalist',     titleBg: '#f5f5f5', slideBg: '#ffffff', accent: '#282828', titleText: '#191919', bodyText: '#333333' },
  { id: 'coal',       name: 'Dark Elegant',   titleBg: '#12121a', slideBg: '#18182a', accent: '#8b5cf6', titleText: '#ffffff', bodyText: '#e2e2e2' },
  { id: 'blues',      name: 'Modern Blue',    titleBg: '#062c6e', slideBg: '#f8fafc', accent: '#0e6bf7', titleText: '#ffffff', bodyText: '#1e293b' },
  { id: 'elysia',     name: 'Rose Creative',  titleBg: '#9d174d', slideBg: '#fdf2f8', accent: '#ec4899', titleText: '#ffffff', bodyText: '#831843' },
  { id: 'breeze',     name: 'Ocean Fresh',    titleBg: '#005064', slideBg: '#f0fdfa', accent: '#009688', titleText: '#ffffff', bodyText: '#134e4a' },
  { id: 'aurora',     name: 'Purple Premium', titleBg: '#310a65', slideBg: '#faf5ff', accent: '#9333ea', titleText: '#ffffff', bodyText: '#581c87' },
  { id: 'coral-glow', name: 'Coral Warm',     titleBg: '#b43732', slideBg: '#fff7f5', accent: '#ef4444', titleText: '#ffffff', bodyText: '#7f1d1d' },
  { id: 'gamma',      name: 'Colorful',       titleBg: '#2563eb', slideBg: '#f8fafc', accent: '#4f46e5', titleText: '#ffffff', bodyText: '#1e293b' },
];

export const PRODUCTS: ProductMeta[] = [
  { id: 'presentation',    name: 'Prezentatsiya',      icon: '📊', desc: 'Professional PPTX slaydlar',          minSlides: 5,  maxSlides: 30, priceUnit: 'slide',    category: 'presentation' },
  { id: 'mustaqil_ish',    name: 'Mustaqil ish',        icon: '📝', desc: 'Fan bo\'yicha tadqiqot',              minPages: 5,   maxPages: 20,  priceUnit: 'page',     category: 'document' },
  { id: 'referat',         name: 'Referat',             icon: '📄', desc: 'Mavzu bo\'yicha ilmiy tahlil',        minPages: 10,  maxPages: 25,  priceUnit: 'page',     category: 'document' },
  { id: 'kurs_ishi',       name: 'Kurs ishi',           icon: '📚', desc: 'Chuqur ilmiy tadqiqot',               minPages: 25,  maxPages: 50,  priceUnit: 'page',     category: 'document' },
  { id: 'diplom_ishi',     name: 'Diplom ishi',         icon: '🎓', desc: 'Bitiruv malakaviy ishi',              minPages: 50,  maxPages: 80,  priceUnit: 'page',     category: 'document' },
  { id: 'magistr_diss',    name: 'Magistr dissertatsiya', icon: '🎯', desc: 'Magistrlik ilmiy ishi',             minPages: 60,  maxPages: 100, priceUnit: 'page',     category: 'document' },
  { id: 'tezis',           name: 'Tezis',               icon: '📋', desc: 'Ilmiy konferensiya tezisi',           minPages: 3,   maxPages: 10,  priceUnit: 'page',     category: 'document' },
  { id: 'ilmiy_maqola',    name: 'Ilmiy maqola',        icon: '🔬', desc: 'Jurnal uchun ilmiy maqola',           minPages: 5,   maxPages: 15,  priceUnit: 'page',     category: 'document' },
  { id: 'laboratoriya_ishi', name: 'Laboratoriya ishi', icon: '🧪', desc: 'Lab ishi hisoboti',                  minPages: 5,   maxPages: 15,  priceUnit: 'page',     category: 'document' },
  { id: 'amaliy_ish',      name: 'Amaliy ish',          icon: '⚙️', desc: 'Amaliy mashg\'ulot ishi',            minPages: 5,   maxPages: 20,  priceUnit: 'page',     category: 'document' },
  { id: 'hisobot',         name: 'Hisobot',             icon: '📈', desc: 'Amaliyot yoki loyiha hisoboti',       minPages: 10,  maxPages: 30,  priceUnit: 'page',     category: 'document' },
  { id: 'krossvord',       name: 'Krossvord',           icon: '🔤', desc: 'Mavzu bo\'yicha interaktiv krossvord', priceUnit: 'fixed', category: 'creative' },
];

export const PLANS: PlanDetails[] = [
  {
    code: 'free',
    name: 'Bepul',
    price: 0,
    duration_days: 30,
    monthly_ai_works: 1,
    monthly_templates: 0,
    features: ['1 ta bepul prezentatsiya', 'Asosiy sifat', 'Telegram orqali yuklash'],
  },
  {
    code: 'start',
    name: 'Start',
    price: 29900,
    duration_days: 30,
    monthly_ai_works: 10,
    monthly_templates: 3,
    features: ['10 ta AI ish/oy', '3 ta template/oy', 'Barcha hujjat turlari', 'Ustuvor navbat'],
  },
  {
    code: 'premium',
    name: 'Premium',
    price: 79900,
    duration_days: 30,
    monthly_ai_works: 999,
    monthly_templates: 999,
    features: ['Cheksiz AI ishlari', 'Cheksiz templatelar', 'Krossvord generator', 'Ustuvor navbat', 'Premium support'],
  },
];

export const BOT_API_URL = process.env.BOT_API_URL ?? 'http://149.102.139.89:8081';
export const API_SECRET  = process.env.API_SECRET  ?? 'aislide_secret_2026';
