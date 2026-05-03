import type { PresentationOutline, Slide, SubmitResult } from '@/types';

async function call<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: 'Network error' }));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `API error: ${res.status}`);
  return data as T;
}

export const api = {
  generateOutline: (params: {
    topic: string;
    details?: string;
    slideCount: number;
    language: string;
  }) => call<PresentationOutline>('generate-outline', params),

  generateSlide: (params: {
    topic: string;
    slideTitle: string;
    slideNumber: number;
    totalSlides: number;
    language: string;
    keyPoints: string[];
    presentationTitle: string;
  }) => call<Omit<Slide, 'slide_number' | 'image' | 'status'>>('generate-slide', params),

  fetchImage: (keywords: { primary: string; secondary: string; fallback: string }) =>
    call<{ url: string; thumb: string }>('fetch-image', { keywords }),

  submitPresentation: (data: {
    telegram_id: number | null;
    source?: string;
    topic: string;
    details: string;
    slide_count: number;
    theme_id: string;
    language: string;
    pre_generated: boolean;
    title: string;
    subtitle: string;
    slides: unknown[];
  }) => call<SubmitResult>('submit-presentation', data),

  submitDocument: (data: {
    telegram_id: number | null;
    work_type: string;
    work_name: string;
    topic: string;
    subject_name: string;
    page_count: number;
    language: string;
    language_name: string;
    details?: string;
    file_format: string;
    student_name?: string;
    student_group?: string;
    teacher_name?: string;
    teacher_rank?: string;
    university?: string;
    faculty?: string;
    word_count?: number;  // krossvord uchun
    email?: string;       // tezis uchun
  }) => call<SubmitResult>('submit-presentation', { ...data, type: 'document' }),

  getTaskStatus: (uuid: string) =>
    fetch(`/api/task-status?uuid=${uuid}`).then(r => r.json()),
};
