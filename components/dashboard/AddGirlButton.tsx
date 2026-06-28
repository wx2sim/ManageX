'use client';

import { useState, useTransition, useRef } from 'react';
import { addGirl } from '@/actions/girls';

export default function AddGirlButton({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await addGirl(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        setPreviewUrl(null);
        formRef.current?.reset();
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
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
            Add Resident
          </p>
          {!compact && <p className="text-sm text-zinc-500 mt-1">Create a new resident card</p>}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-pink-200 bg-white shadow-[0_20px_100px_rgba(236,72,153,0.25)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pink-100 p-5 shrink-0 bg-white">
              <h2 className="text-lg font-semibold text-zinc-950">Add New Resident</h2>
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
              {/* Picture Upload */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center text-3xl text-pink-700 border border-pink-200 cursor-pointer overflow-hidden relative group hover:opacity-90 transition"
                  title="Upload picture"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold">
                    Upload
                  </div>
                </div>
                <input
                  type="file"
                  name="avatar"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xxs text-zinc-400">Click to upload photo (Optional)</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full name"
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
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
                Cancel
              </button>
              <button
                type="submit"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isPending}
                className="flex-1 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
