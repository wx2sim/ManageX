'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FixedPaymentTemplate } from '@/lib/types';
import { 
  saveFixedPaymentTemplate, 
  deleteFixedPaymentTemplate, 
  applyFixedPayment 
} from '@/actions/transactions';
import { formatDZD } from '@/lib/utils/formatters';

interface FixedPaymentFormProps {
  girlId: string;
  templates: FixedPaymentTemplate[];
}

export default function FixedPaymentForm({ girlId, templates }: FixedPaymentFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amount);
    if (!name || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a name and valid amount');
      return;
    }

    startTransition(async () => {
      const res = await saveFixedPaymentTemplate(girlId, name, parsedAmount);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Template saved successfully!');
        setName('');
        setAmount('');
        router.refresh();
      }
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setError(null);
    setSuccess(null);
    setActiveActionId(templateId);

    startTransition(async () => {
      const res = await deleteFixedPaymentTemplate(templateId, girlId);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Template removed.');
        router.refresh();
      }
      setActiveActionId(null);
    });
  };

  const handleApplyTemplate = (template: FixedPaymentTemplate) => {
    setError(null);
    setSuccess(null);
    setActiveActionId(`apply-${template.id}`);

    startTransition(async () => {
      const res = await applyFixedPayment(girlId, template.default_amount, template.name);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`Charged ${formatDZD(template.default_amount)} for ${template.name} successfully!`);
        router.refresh();
      }
      setActiveActionId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Template Form */}
      <form onSubmit={handleCreateTemplate} className="space-y-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)]">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Add Recurrent Charge Template</h2>
          <p className="text-xs text-zinc-500 mt-1">Define standard charges like Rent or WiFi that you can apply with one click.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Monthly Rent, Wi-Fi share"
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Default Amount (DZD) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 85000"
              min="1"
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none"
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
          {isPending && !activeActionId ? 'Saving template...' : 'Save Template'}
        </button>
      </form>

      {/* Applied templates list */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Active Templates</h2>
          <p className="text-xs text-zinc-500 mt-1">Click "Apply Charge" to execute the template transaction.</p>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">No fixed templates created yet. Use the form above to add one.</p>
        ) : (
          <div className="divide-y divide-pink-50">
            {templates.map((tpl) => {
              const isApplying = activeActionId === `apply-${tpl.id}`;
              const isDeleting = activeActionId === tpl.id;

              return (
                <div key={tpl.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{tpl.name}</h3>
                    <p className="text-xs text-pink-700 font-semibold mt-1">{formatDZD(tpl.default_amount)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      disabled={isPending}
                      className="rounded-xl bg-pink-50 text-pink-700 border border-pink-100 px-4 py-2 text-xs font-semibold transition hover:bg-pink-100 disabled:opacity-50"
                    >
                      {isApplying ? 'Applying...' : 'Apply Charge'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      disabled={isPending}
                      className="rounded-xl border border-zinc-200 bg-white hover:bg-rose-50 hover:text-rose-600 px-3 py-2 text-xs transition disabled:opacity-50"
                      title="Delete Template"
                    >
                      {isDeleting ? 'Deleting...' : '✕'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
