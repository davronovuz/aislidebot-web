'use client';

import { useRouter } from 'next/navigation';
import { haptic } from '@/lib/telegram';
import { Wallet, AlertCircle, CheckCircle, Gift } from 'lucide-react';

interface PriceCardProps {
  price: number;
  balance: number;
  isFree?: boolean;
  freeLeft?: number;
}

export function PriceCard({ price, balance, isFree, freeLeft }: PriceCardProps) {
  const router = useRouter();
  const enough = isFree || balance >= price;
  const shortage = Math.max(0, price - balance);

  if (isFree && freeLeft !== undefined) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Gift size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-green-700">Bu yaratish BEPUL!</p>
            <p className="text-[11px] text-green-500 mt-0.5">{freeLeft} ta bepul huquq qoldi</p>
          </div>
          <CheckCircle size={18} className="text-green-500 ml-auto flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${enough ? 'border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]' : 'border-red-100 bg-red-50'}`}>
      {/* Price row */}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">To'lov</p>
          <p className="text-[22px] font-bold text-black leading-tight mt-0.5">
            {price.toLocaleString()}
            <span className="text-[13px] font-medium text-black/40 ml-1">so'm</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wider flex items-center justify-end gap-1">
            <Wallet size={10} /> Balans
          </p>
          <p className={`text-[18px] font-bold mt-0.5 ${enough ? 'text-green-600' : 'text-red-500'}`}>
            {balance.toLocaleString()}
            <span className="text-[11px] font-medium ml-0.5">so'm</span>
          </p>
        </div>
      </div>

      {/* Status */}
      {enough ? (
        <div className="px-4 pb-3.5 flex items-center gap-1.5">
          <CheckCircle size={13} className="text-green-500" />
          <p className="text-[12px] text-green-600 font-medium">Balans yetarli — to'lov tayyior</p>
        </div>
      ) : (
        <div className="border-t border-red-100">
          <div className="px-4 py-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] text-red-600 font-medium">
                {shortage.toLocaleString()} so'm yetishmayapti
              </p>
              <p className="text-[11px] text-red-400 mt-0.5">Balansni to'ldiring va qaytib keling</p>
            </div>
          </div>
          <div className="px-4 pb-3.5">
            <button
              onClick={() => { haptic('medium'); router.push('/profile'); }}
              className="w-full py-2.5 bg-red-500 rounded-xl text-white text-[13px] font-semibold"
            >
              Balansni to'ldirish →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
