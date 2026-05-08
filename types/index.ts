// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  balance: number;
  free_credits: number;
  subscription_plan: SubscriptionPlan | null;
  subscription_expires_at: string | null;
  created_at: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductType =
  | 'presentation'
  | 'pitch_deck'
  | 'mustaqil_ish'
  | 'referat'
  | 'kurs_ishi'
  | 'diplom_ishi'
  | 'magistr_diss'
  | 'tezis'
  | 'ilmiy_maqola'
  | 'laboratoriya_ishi'
  | 'amaliy_ish'
  | 'hisobot'
  | 'krossvord';

export interface ProductMeta {
  id: ProductType;
  name: string;
  icon: string;
  desc: string;
  minPages?: number;
  maxPages?: number;
  minSlides?: number;
  maxSlides?: number;
  priceUnit: 'page' | 'slide' | 'fixed';
  category: 'presentation' | 'document' | 'creative';
}

// ─── Slides ───────────────────────────────────────────────────────────────────

export interface ImageKeywords {
  primary: string;
  secondary: string;
  fallback: string;
}

export interface SlideImage {
  url: string;
  thumb: string;
  author?: string;
}

export interface Slide {
  slide_number: number;
  title: string;
  content: string | null;
  bullet_points: string[] | null;
  image_keywords: ImageKeywords | null;
  image: SlideImage | null;
  status: 'pending' | 'generating' | 'content' | 'ready' | 'error' | 'regenerating';
}

export interface PresentationOutline {
  title: string;
  subtitle: string;
  slides: Array<{
    slide_number: number;
    title: string;
    key_points: string[];
    image_hint: string;
  }>;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  uuid: string;
  product_type: ProductType;
  status: TaskStatus;
  progress: number;
  error_message: string | null;
  output_url: string | null;
  amount_charged: number;
  created_at: string;
  completed_at: string | null;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export type TemplateCategory = 'business' | 'education' | 'creative' | 'tech' | 'other';

export interface Template {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail_url: string;
  preview_pdf_url: string | null;
  slide_count: number;
  price: number;
  is_free: boolean;
  download_count: number;
  rating: number | null;
  is_active: boolean;
  created_at: string;
}

// ─── Ready Works ─────────────────────────────────────────────────────────────

export interface ReadyWork {
  id: number;
  slug: string;
  title: string;
  abstract: string;
  product_type: ProductType;
  subject: string;
  topic_keywords: string[];
  page_count: number;
  language: 'uz' | 'ru' | 'en';
  preview_pdf_url: string;
  price: number;
  sales_count: number;
  rating: number | null;
  created_at: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'refund' | 'purchase';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'start' | 'premium';

export interface PlanDetails {
  code: SubscriptionPlan;
  name: string;
  price: number;
  duration_days: number;
  monthly_ai_works: number;
  monthly_templates: number;
  features: string[];
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export interface SubmitResult {
  ok: boolean;
  task_uuid: string;
  amount_charged: number;
  is_free: boolean;
}

// ─── Themes ───────────────────────────────────────────────────────────────────

export interface Theme {
  id: string;
  name: string;
  titleBg: string;
  slideBg: string;
  accent: string;
  titleText: string;
  bodyText: string;
  preview?: string;
}

// ─── Premium Templates (manifest-backed, designer .pptx) ─────────────────────

export interface PremiumTemplate {
  file: string;          // "simple_professional.pptx"
  name: string;          // "Simple Professional"
  description: string;
  emoji: string;
  is_premium: boolean;   // true → TemplateInjector (designer slidelar), false → HybridGenerator
  bullets_per_slide: number[];
}

// ─── Languages ────────────────────────────────────────────────────────────────

export type Language = 'uz' | 'ru' | 'en';

export interface LanguageMeta {
  id: Language;
  label: string;
  flag: string;
}
