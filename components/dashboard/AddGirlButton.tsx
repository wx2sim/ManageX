'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useRef } from 'react';
import { addGirl } from '@/actions/girls';
import { useTranslation } from '@/lib/i18n/useTranslation';

const AVATARS = ['👩🏻', '👩🏼', '👩🏽', '👩🏾', '👱‍♀️', '👩‍🦰'];

export default function AddGirlButton({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useOverlayTransition();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const { t, tError } = useTranslation();
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await addGirl(formData);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        setIsOpen(false);
        setSelectedAvatar(AVATARS[0]);
        formRef.current?.reset();
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAvatar(AVATARS[0]);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={compact 
          ? "flex items-center justify-start gap-3 rounded-2xl border border-dashed border-pink-200 bg-white/90 p-4 text-zinc-700 transition hover:border-pink-300 hover:bg-pink-50 w-full text-left" 
          : "flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-pink-200 bg-white/90 p-8 text-center text-zinc-700 transition hover:border-pink-300 hover:bg-pink-50"
        }
      >
        <div className={compact 
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-xl text-pink-700 font-semibold" 
          : "flex h-16 w-16 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-3xl text-pink-700 font-semibold"
        }>
          +
        </div>
        <div className={compact ? 'text-left' : ''}>
          <p className={compact ? 'text-sm font-semibold text-zinc-800' : 'text-lg font-semibold text-zinc-800'}>
            {t('dashboard.addResident')}
          </p>
          {!compact && <p className="text-sm text-zinc-500 mt-1">{t('forms.addResidentDesc')}</p>}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-pink-200 bg-white shadow-[0_20px_100px_rgba(236,72,153,0.25)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pink-100 p-5 shrink-0 bg-white">
              <h2 className="text-lg font-semibold text-zinc-950">{t('forms.addResidentTitle')}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-lg text-zinc-400 transition hover:text-zinc-600 focus:outline-none"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto flex-1 bg-white">
              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  {t('forms.upload') || 'Select Avatar'}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-3xl transition border ${selectedAvatar === avatar ? 'bg-pink-100 border-pink-400 scale-110 shadow-sm' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 grayscale hover:grayscale-0'}`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="avatar" value={selectedAvatar} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  {t('forms.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t('forms.fullName')}
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  {t('forms.startDate')}
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  {t('forms.accountType') || 'Account Type'}
                </label>
                <select
                  name="account_type"
                  defaultValue="resident"
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                >
                  <option value="resident">{t('forms.resident') || 'Resident'}</option>
                  <option value="nuitee">{t('forms.nuitee') || 'Nuitée (Short term)'}</option>
                  <option value="admin">{t('common.admin')}</option>
                </select>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}
            </form>

            {/* Modal Actions */}
            <div className="flex gap-3 p-5 border-t border-pink-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isPending}
                className="flex-1 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? t('common.loading') : t('forms.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
