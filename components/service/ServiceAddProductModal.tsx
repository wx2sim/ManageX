'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMarketStockData } from '@/actions/market_logic';
import MarketStockClient from '@/components/market/MarketStockClient';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ServiceAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceAddProductModal({ isOpen, onClose }: ServiceAddProductModalProps) {
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      // Fetch the required market data asynchronously so we don't slow down the resident service page payload
      getMarketStockData().then((res) => {
        setData(res);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 flex justify-center items-start md:items-center">
      <div className="w-full max-w-4xl bg-[#fff5fb] rounded-3xl relative my-auto shadow-[0_20px_100px_rgba(236,72,153,0.25)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 hover:bg-white rounded-full shadow-sm text-zinc-500 hover:text-zinc-900 transition focus:outline-none"
        >
          ✕
        </button>

        {!data ? (
          <div className="p-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-semibold">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : (
          <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto w-full">
            <MarketStockClient 
              items={data.items}
              categories={data.categories}
              subcategories={data.subcategories}
              marketInputs={data.marketInputs}
              recipes={data.recipes}
              recipeIngredients={data.recipeIngredients}
              isModal={true}
              onSuccessModal={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
