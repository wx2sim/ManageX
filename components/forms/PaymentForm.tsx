'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPayment } from '@/actions/transactions';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface PaymentFormProps {
  girlId: string;
}

export default function PaymentForm({ girlId }: PaymentFormProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState<'dzd' | 'euro'>('dzd');
  const [destination, setDestination] = useState<'service_debt' | 'recurring_debt'>('service_debt');
  const [amount, setAmount] = useState('');
  const [euroAmount, setEuroAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useOverlayTransition();
  const { t, tError } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amount);
    const parsedEuro = parseFloat(euroAmount);
    const parsedRate = parseFloat(exchangeRate);

    if (currency === 'dzd' && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      setError(t('payment.invalidAmount') || 'Invalid DZD amount');
      return;
    }

    if (currency === 'euro' && (isNaN(parsedEuro) || parsedEuro <= 0 || isNaN(parsedRate) || parsedRate <= 0)) {
      setError('Invalid Euro amount or Exchange Rate');
      return;
    }

    startTransition(async () => {
      const res = await addPayment(
        girlId,
        currency === 'dzd' ? parsedAmount : 0,
        note,
        currency,
        currency === 'euro' ? parsedEuro : 0,
        currency === 'euro' ? parsedRate : 0,
        destination
      );

      if (res?.error) {
        setError(tError(res.error));
      } else {
        setSuccess(t('payment.success') || 'Payment registered');
        setAmount('');
        setEuroAmount('');
        setExchangeRate('');
        setNote('');
        router.refresh();
      }
    });
  };

  const calculatedDzd = (parseFloat(euroAmount) || 0) * (parseFloat(exchangeRate) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)]">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">{t('payment.title') || 'Register Payment'}</h2>
        <p className="text-xs text-zinc-500 mt-1">{t('payment.desc') || 'Log a payment made to the house.'}</p>
      </div>

      <div className="space-y-5">
        {/* Destination Toggle */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Payment Target
          </label>
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDestination('service_debt')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${destination === 'service_debt' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Services Debt
            </button>
            <button
              type="button"
              onClick={() => setDestination('recurring_debt')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${destination === 'recurring_debt' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Recurring Charges
            </button>
          </div>
        </div>

        {/* Currency Toggle */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Currency
          </label>
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrency('dzd')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${currency === 'dzd' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              DZD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('euro')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${currency === 'euro' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              EURO (€)
            </button>
          </div>
        </div>

        {/* Amount Inputs */}
        {currency === 'dzd' ? (
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Amount (DZD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 5000"
              min="1"
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
        ) : (
          <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                  Euro Amount (€)
                </label>
                <input
                  type="number"
                  value={euroAmount}
                  onChange={(e) => setEuroAmount(e.target.value)}
                  required
                  placeholder="e.g. 50"
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  required
                  placeholder="e.g. 240"
                  min="1"
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            
            <div className="pt-2 border-t border-blue-100">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-blue-800">Equivalent in DZD:</span>
                <span className="font-bold text-lg text-blue-900">{calculatedDzd.toLocaleString()} DZD</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">This DZD amount will be paid towards {destination === 'service_debt' ? 'Services' : 'Recurring'} Debt.</p>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
            {t('payment.noteLabel') || 'Note (Optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('payment.notePlaceholder')}
            rows={2}
            className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-medium">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
      >
        {isPending ? t('payment.loggingPayment') : (currency === 'euro' ? 'Save Euro & Pay Debt' : 'Pay Debt')}
      </button>
    </form>
  );
}
