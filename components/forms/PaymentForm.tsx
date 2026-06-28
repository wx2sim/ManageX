'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addPayment } from '@/actions/transactions';

interface PaymentFormProps {
  girlId: string;
}

export default function PaymentForm({ girlId }: PaymentFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    startTransition(async () => {
      const res = await addPayment(girlId, parsedAmount, note);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Payment logged successfully!');
        setAmount('');
        setNote('');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)]">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Log Cash/Card Payment</h2>
        <p className="text-xs text-zinc-500 mt-1">This will deduct from the outstanding debt balance.</p>
      </div>

      <div className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
            Amount (DZD) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="e.g. 15000"
            min="1"
            className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
            Note / Reference
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Cash payment for Rent, Bank Transfer ref: 12345"
            rows={3}
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
        className="w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
      >
        {isPending ? 'Logging payment...' : 'Register Payment'}
      </button>
    </form>
  );
}
