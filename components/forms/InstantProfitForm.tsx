'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addInstantProfit } from '@/actions/transactions';

export default function InstantProfitForm() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'profit' | 'loss'>('profit');
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
      const res = await addInstantProfit(parsedAmount, note, type);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`${type === 'profit' ? 'Profit' : 'Loss'} logged successfully!`);
        setAmount('');
        setNote('');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)]">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Record Instant Profit / Loss</h2>
        <p className="text-xs text-zinc-500 mt-1">This logs general ad-hoc transaction flows directly into the database.</p>
      </div>

      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
        <button
          type="button"
          onClick={() => setType('profit')}
          className={`rounded-lg py-2.5 text-xs font-semibold transition ${
            type === 'profit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          📈 Profit (Gain)
        </button>
        <button
          type="button"
          onClick={() => setType('loss')}
          className={`rounded-lg py-2.5 text-xs font-semibold transition ${
            type === 'loss'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          📉 Loss (Expense)
        </button>
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
            placeholder="e.g. 4500"
            min="1"
            className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
            Description / Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Sold unused cosmetics, courier delivery expense fee"
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
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${
          type === 'profit' 
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
        }`}
      >
        {isPending ? 'Logging transaction...' : `Log ${type === 'profit' ? 'Profit' : 'Loss'}`}
      </button>
    </form>
  );
}
