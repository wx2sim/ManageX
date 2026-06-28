'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GirlBalance } from '@/lib/types';
import { updateGirl, toggleGirlActiveStatus, deleteGirl } from '@/actions/girls';
import { formatDate } from '@/lib/utils/formatters';

interface SettingsFormProps {
  girl: GirlBalance;
}

export default function SettingsForm({ girl }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(girl.name);
  const [startDate, setStartDate] = useState(girl.start_date.split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(girl.avatar_url);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError('Name is required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('start_date', startDate);
    if (fileInputRef.current?.files?.[0]) {
      formData.append('avatar', fileInputRef.current.files[0]);
    }

    startTransition(async () => {
      const res = await updateGirl(girl.girl_id, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Profile updated successfully!');
        router.refresh();
      }
    });
  };

  const handleArchiveToggle = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await toggleGirlActiveStatus(girl.girl_id, !girl.is_active);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`Profile ${girl.is_active ? 'archived' : 'activated'} successfully!`);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (confirm(`CRITICAL WARNING: Are you sure you want to permanently delete ${girl.name}? All transaction logs, payments, service checkout records, and history will be deleted. This cannot be undone.`)) {
      setError(null);
      setSuccess(null);
      startTransition(async () => {
        const res = await deleteGirl(girl.girl_id);
        if (res?.error) {
          setError(res.error);
        } else {
          router.push('/');
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Profile Info Form */}
      <form onSubmit={handleSave} className="space-y-5 bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)]">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Edit Profile Details</h2>
          <p className="text-xs text-zinc-500 mt-1">Modify name, registration date, or upload a new photo.</p>
        </div>

        {/* Picture Upload */}
        <div className="flex flex-col items-center gap-2">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center text-3xl text-pink-700 border border-pink-200 cursor-pointer overflow-hidden relative group hover:opacity-95 transition"
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
              Change
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
          <p className="text-xxs text-zinc-400">Click avatar image to change</p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Joining Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
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
          {isPending ? 'Saving changes...' : 'Save Settings'}
        </button>
      </form>

      {/* Account Actions Box */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Danger Zone</h2>
          <p className="text-xs text-zinc-500 mt-1">Actions to temporarily archive or permanently remove a resident profile.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {girl.is_active ? 'Archive Profile' : 'Restore Profile'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {girl.is_active 
                ? 'Hides the resident card from the active dashboard view.' 
                : 'Restores the resident card back to the active dashboard view.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleArchiveToggle}
            disabled={isPending}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition disabled:opacity-50 shrink-0 ${
              girl.is_active 
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' 
                : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
            }`}
          >
            {girl.is_active ? 'Archive Profile' : 'Restore Active'}
          </button>
        </div>

        <div className="h-px bg-zinc-100" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Delete Profile</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Permanently deletes the resident, all services billing, and transaction logs.</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 shrink-0"
          >
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  );
}
