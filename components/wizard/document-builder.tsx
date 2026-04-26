'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Minus, Plus, GraduationCap, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/progress-bar';
import { PriceCard } from '@/components/shared/price-card';
import { LANGUAGES, PRODUCTS } from '@/lib/constants';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Language, ProductType } from '@/types';

interface PriceInfo { balance: number; pricePerPage: number; }

export default function DocumentBuilder({
  productType,
  priceInfo,
}: {
  productType: ProductType;
  priceInfo: PriceInfo;
}) {
  const router = useRouter();
  const product = PRODUCTS.find(p => p.id === productType)!;
  const TOTAL_STEPS = 6;

  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [pages, setPages] = useState(product.minPages ?? 10);
  const [lang, setLang] = useState<Language>('uz');
  const [fileFormat, setFileFormat] = useState<'docx' | 'pdf'>('docx');
  const [details, setDetails] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherRank, setTeacherRank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real balance from API
  const [balance, setBalance] = useState(priceInfo.balance);

  const tg = useRef(getTelegramWebApp());
  const telegramId = useRef(getTelegramId());
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');

    const tid = telegramId.current;
    if (tid) {
      fetch(`/api/user-info?telegram_id=${tid}`)
        .then(r => r.json())
        .then(d => { if (d.ok) setBalance(d.balance); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 2) topicRef.current?.focus();
      if (step === 3) subjectRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [step]);

  const canNext = () => {
    if (step === 2) return topic.trim().length >= 5;
    return true;
  };

  const goNext = () => { if (canNext() && step < TOTAL_STEPS) { haptic('light'); setStep(s => s + 1); } };
  const goBack = () => { if (step > 1) { haptic('light'); setStep(s => s - 1); } };

  const handleSend = async () => {
    haptic('success');
    setIsSubmitting(true);
    const tid = telegramId.current ?? getTelegramId();
    const selectedLang = LANGUAGES.find(l => l.id === lang);

    const data = {
      telegram_id: tid,
      work_type: productType,
      work_name: product.name,
      topic,
      subject_name: subject,
      page_count: pages,
      language: lang,
      language_name: selectedLang?.label ?? "O'zbekcha",
      details,
      file_format: fileFormat,
      student_name: studentName,
      student_group: studentGroup,
      teacher_name: teacherName,
      teacher_rank: teacherRank,
      university,
      faculty,
    };

    if (!tid) {
      // Telegram WebApp sendData
      if (tg.current) tg.current.sendData(JSON.stringify(data));
      else { alert('Dev mode: ' + JSON.stringify(data).slice(0, 200)); setIsSubmitting(false); }
      return;
    }

    try {
      await api.submitDocument(data);
      tg.current?.close();
    } catch (err) {
      setIsSubmitting(false);
      haptic('error');
      const msg = (err as Error).message ?? '';
      if (msg.includes('insufficient_balance')) {
        router.push('/profile');
        return;
      }
      alert(msg || 'Xatolik yuz berdi');
    }
  };

  const totalPrice = (priceInfo.pricePerPage ?? 500) * pages;
  const canAfford = balance >= totalPrice;
  const selectedLang = LANGUAGES.find(l => l.id === lang);
  const min = product.minPages ?? 5;
  const max = product.maxPages ?? 50;

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 pt-4 pb-3 border-b border-black/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {step > 1 ? (
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
              <ChevronLeft size={20} className="text-black/60" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <GraduationCap size={16} className="text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-[16px] font-bold text-black">{product.name} yaratish</h1>
            <p className="text-[11px] text-black/35 mt-0.5">Bosqich {step} / {TOTAL_STEPS}</p>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
            <span className="text-white text-[10px] font-bold">{(priceInfo.pricePerPage ?? 500).toLocaleString()} / bet</span>
          </div>
        </div>
        <ProgressBar value={(step / TOTAL_STEPS) * 100} className="mt-3" />
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto">

        {/* Step 1: Work type info */}
        {step === 1 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">{product.name}</h2>
            <p className="text-[13px] text-black/40 mt-1">{product.desc}</p>
            <div className="mt-5 space-y-3">
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{product.icon}</span>
                  <div>
                    <p className="text-[15px] font-bold text-black">{product.name}</p>
                    <p className="text-[12px] text-black/40">{min}–{max} sahifa</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                <p className="text-[11px] text-orange-600 leading-relaxed">
                  ⚡ AI sizning mavzungiz bo&apos;yicha to&apos;liq professional ish yozadi. O&apos;zbek GOST standartida formatlanadi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Topic */}
        {step === 2 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">Mavzuni yozing</h2>
            <p className="text-[13px] text-black/40 mt-1">{product.name} mavzusini kiriting</p>
            <div className="mt-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
              <textarea
                ref={topicRef}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Masalan: Sun'iy intellektning ta'lim sohasidagi o'rni va istiqbollari"
                rows={4}
                className="w-full text-[15px] text-black placeholder-black/20 outline-none resize-none bg-transparent leading-relaxed"
              />
            </div>
            {topic.length > 0 && topic.length < 5 && (
              <p className="text-[12px] text-orange-500 mt-2 ml-1">Kamida 5 ta belgi</p>
            )}
            {topic.length >= 5 && (
              <p className="text-[12px] text-green-500 mt-2 ml-1 flex items-center gap-1">
                <Check size={14} /> Tayyor
              </p>
            )}
          </div>
        )}

        {/* Step 3: Subject */}
        {step === 3 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">Fan nomini yozing</h2>
            <p className="text-[13px] text-black/40 mt-1">Ixtiyoriy — o&apos;tkazib yuborishingiz mumkin</p>
            <div className="mt-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Masalan: Informatika"
                className="w-full text-[16px] text-black placeholder-black/20 outline-none bg-transparent"
              />
            </div>
            {subject.trim().length === 0 && (
              <button
                onClick={() => { haptic('light'); setStep(4); }}
                className="mt-3 w-full py-3 rounded-2xl bg-black/5 text-[13px] font-medium text-black/40"
              >
                O&apos;tkazib yuborish
              </button>
            )}
          </div>
        )}

        {/* Step 4: Title page */}
        {step === 4 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">Titul sahifa</h2>
            <p className="text-[13px] text-black/40 mt-1">Ixtiyoriy — bo&apos;sh qoldirsangiz ham bo&apos;ladi</p>
            <div className="mt-5 space-y-2.5">
              {[
                { label: 'Universitet nomi', icon: '🏛', value: university, onChange: setUniversity, placeholder: 'Masalan: TATU' },
                { label: 'Fakultet', icon: '🏫', value: faculty, onChange: setFaculty, placeholder: 'Masalan: Kompyuter injiniringi' },
                { label: 'Talaba F.I.O.', icon: '👤', value: studentName, onChange: setStudentName, placeholder: 'Masalan: Karimov Jasur' },
                { label: 'Guruh', icon: '👥', value: studentGroup, onChange: setStudentGroup, placeholder: 'Masalan: 210-22' },
                { label: 'Ilmiy rahbar F.I.O.', icon: '👨‍🏫', value: teacherName, onChange: setTeacherName, placeholder: 'Masalan: Rahimov A.B.' },
                { label: 'Rahbar darajasi', icon: '🎖', value: teacherRank, onChange: setTeacherRank, placeholder: 'Masalan: dots., prof., PhD' },
              ].map(f => (
                <div key={f.label} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
                  <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{f.icon}</span>{f.label}
                  </label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full mt-2 text-[15px] text-black placeholder-black/20 outline-none bg-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Settings */}
        {step === 5 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">Sozlamalar</h2>
            <p className="text-[13px] text-black/40 mt-1">Sahifa soni, til va format</p>
            <div className="mt-5 space-y-2.5">
              {/* Pages */}
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
                <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Sahifalar soni</span>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => { haptic('light'); setPages(p => Math.max(min, p - 1)); }}
                    className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center"
                  >
                    <Minus size={18} className="text-black/50" />
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-black tabular-nums">{pages}</span>
                    <p className="text-[10px] text-black/30 mt-0.5">{min}–{max} bet</p>
                  </div>
                  <button
                    onClick={() => { haptic('light'); setPages(p => Math.min(max, p + 1)); }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200"
                  >
                    <Plus size={18} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
                <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Til</span>
                <div className="flex gap-2 mt-2.5">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { haptic('select'); setLang(l.id); }}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5',
                        lang === l.id
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                          : 'bg-black/5 text-black/50'
                      )}
                    >
                      <span>{l.flag}</span>{l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
                <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Fayl formati</span>
                <div className="flex gap-2 mt-2.5">
                  {(['docx', 'pdf'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => { haptic('select'); setFileFormat(f); }}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-semibold',
                        fileFormat === f
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                          : 'bg-black/5 text-black/50'
                      )}
                    >
                      <span className="text-lg">{f === 'docx' ? '📝' : '📄'}</span>
                      <p className="text-[13px] mt-0.5">{f.toUpperCase()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
                <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">
                  Qo&apos;shimcha <span className="text-black/15">(ixtiyoriy)</span>
                </span>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Maxsus talablar, qo'shimcha ma'lumotlar..."
                  rows={2}
                  className="w-full mt-2 text-[14px] text-black placeholder-black/20 outline-none resize-none bg-transparent leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirm */}
        {step === 6 && (
          <div>
            <h2 className="text-[21px] font-bold text-black">Tasdiqlash</h2>
            <p className="text-[13px] text-black/40 mt-1">Tekshiring va yuboring</p>
            <div className="mt-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
              {[
                { icon: product.icon, label: 'Ish turi', value: product.name },
                { icon: '📚', label: 'Mavzu', value: topic },
                subject && { icon: '📖', label: 'Fan', value: subject },
                university && { icon: '🏛', label: 'Universitet', value: university },
                faculty && { icon: '🏫', label: 'Fakultet', value: faculty },
                studentName && { icon: '👤', label: 'Talaba', value: `${studentName}${studentGroup ? ` (${studentGroup})` : ''}` },
                teacherName && { icon: '👨‍🏫', label: 'Rahbar', value: `${teacherRank ? teacherRank + ' ' : ''}${teacherName}` },
                { icon: '📄', label: 'Sahifalar', value: `${pages} ta` },
                { icon: selectedLang?.flag, label: 'Til', value: selectedLang?.label },
                { icon: fileFormat === 'docx' ? '📝' : '📄', label: 'Format', value: fileFormat.toUpperCase() },
              ].filter(Boolean).map((row, i, arr) => row && (
                <div key={i} className={cn('px-4 py-3.5 flex items-start gap-3', i < arr.length - 1 && 'border-b border-black/5')}>
                  <span className="text-base mt-0.5">{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">{row.label}</span>
                    <p className="text-[14px] font-medium text-black mt-0.5 break-words leading-snug">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <PriceCard price={totalPrice} balance={balance} />
            </div>
            <div className="mt-4 rounded-2xl px-4 py-3 border bg-green-50/80 border-green-100">
              <p className="text-[11px] text-green-700 leading-relaxed">
                ✅ Hammasi tayyor! &quot;Yaratish&quot; tugmasini bosing. AI 1-3 daqiqada tayyorlaydi.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-black/5 px-4 py-3 pb-8">
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={goBack} className="w-14 h-[52px] rounded-2xl bg-black/5 flex items-center justify-center">
              <ChevronLeft size={20} className="text-black/50" />
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <Button variant="primary" className="flex-1 h-[52px]" disabled={!canNext()} onClick={goNext}>
              Davom etish <ChevronRight size={16} />
            </Button>
          ) : canAfford ? (
            <Button
              variant="primary"
              className="flex-1 h-[52px] bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200"
              loading={isSubmitting}
              onClick={handleSend}
            >
              <Sparkles size={16} /> Yaratish
            </Button>
          ) : (
            <button
              onClick={() => { haptic('medium'); router.push('/profile'); }}
              className="flex-1 h-[52px] rounded-2xl bg-red-500 text-white font-semibold text-[15px]"
            >
              Balansni to'ldirish →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
