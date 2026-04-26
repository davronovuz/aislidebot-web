'use client';
import { formatPrice } from '@/lib/utils';

interface PriceCardProps {
  price: number;
  balance: number;
  isFree?: boolean;
  freeLeft?: number;
}

export function PriceCard({ price, balance, isFree, freeLeft }: PriceCardProps) {
  const enough = isFree || balance >= price;

  return (
    <div className={`rounded-2xl px-4 py-3.5 ${enough ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]' : 'bg-red-50 border border-red-100'}`}>
      {isFree && freeLeft !== undefined ? (
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">Narx</span>
            <p className="text-[18px] font-bold text-green-600">BEPUL</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">Qolgan bepul</span>
            <p className="text-[18px] font-bold text-orange-500">{freeLeft} ta</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">Narx</span>
            <p className="text-[18px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              {formatPrice(price)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">Balans</span>
            <p className={`text-[16px] font-bold ${enough ? 'text-green-600' : 'text-red-500'}`}>
              {formatPrice(balance)}
            </p>
          </div>
        </div>
      )}
      {!enough && (
        <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
          ⚠️ Balans yetarli emas! Botda /topup buyrug'ini yuboring.
        </p>
      )}
    </div>
  );
}
