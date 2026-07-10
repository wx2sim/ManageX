'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GirlBalance } from '@/lib/types';
import { updateGirl, updateGirlStatus, deleteGirl } from '@/actions/girls';
import { formatDate } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

const AVATARS = ['👩🏻', '👩🏼', '👩🏽', '👩🏾', '👱‍♀️', '👩‍🦰'];

interface SettingsFormProps {
  girl: GirlBalance;
}

export default function SettingsForm({ girl }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(girl.name);
  const [startDate, setStartDate] = useState(girl.start_date.split('T')[0]);
  const [accountType, setAccountType] = useState<'resident' | 'nuitee' | 'admin'>((girl.account_type as any) || 'resident');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useOverlayTransition();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(girl.avatar_url || AVATARS[0]);
  const { t, tError } = useTranslation();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError(t('settings.nameRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('start_date', startDate);
    formData.append('account_type', accountType);
    formData.append('avatar', selectedAvatar);

    startTransition(async () => {
      const res = await updateGirl(girl.girl_id, formData);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        setSuccess(t('settings.profileUpdated'));
        router.refresh();
      }
    });
  };

  const handleArchiveToggle = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const newStatus = (girl.status || (girl.is_active ? 'active' : 'archived')) === 'active' ? 'archived' : 'active';
      const res = await updateGirlStatus(girl.girl_id, newStatus);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        setSuccess(newStatus === 'archived' ? t('settings.profileArchived') : t('settings.profileActivated'));
        router.refresh();
      }
    });
  };

  const handleBlockToggle = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const currentStatus = girl.status || (girl.is_active ? 'active' : 'archived');
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      const res = await updateGirlStatus(girl.girl_id, newStatus);
      if (res?.error) {
        setError(tError(res.error));
      } else {
        setSuccess(newStatus === 'blocked' ? t('common.blocked') : t('common.unblocked'));
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (confirm(t('settings.deleteWarning').replace('{name}', girl.name))) {
      setError(null);
      setSuccess(null);
      startTransition(async () => {
        const res = await deleteGirl(girl.girl_id);
        if (res?.error) {
          setError(tError(res.error));
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
          <h2 className="text-lg font-bold text-zinc-950">{t('settings.title')}</h2>
          <p className="text-xs text-zinc-500 mt-1">{t('settings.desc')}</p>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            {t('settings.changeAvatar') || 'Select Avatar'}
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
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              {t('settings.fullName')}
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
              {t('settings.joiningDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              {t('forms.accountType') || 'Account Type'}
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
            >
              <option value="resident">{t('forms.resident') || 'Resident'}</option>
              <option value="nuitee">{t('forms.nuitee') || 'Nuitée (Short term)'}</option>
              <option value="admin">{t('common.admin')}</option>
            </select>
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
          {isPending ? t('settings.savingChanges') : t('settings.saveSettings')}
        </button>
      </form>

      {/* Account Actions Box */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">{t('settings.dangerZone')}</h2>
          <p className="text-xs text-zinc-500 mt-1">{t('settings.dangerZoneDesc')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {(girl.status === 'blocked') ? t('common.unblock') || 'Unblock Profile' : t('common.block') || 'Deactivate Profile'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(girl.status === 'blocked') ? 'Activate this profile to allow recurring charges again.' : 'Temporarily disable this profile and stop recurring charges.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleBlockToggle}
            disabled={isPending}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition disabled:opacity-50 shrink-0 ${
              girl.status === 'blocked'
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' 
                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {(girl.status === 'blocked') ? t('common.unblock') || 'Unblock' : t('common.block') || 'Deactivate'}
          </button>
        </div>

        <div className="h-px bg-zinc-100" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {(girl.status === 'archived' || !girl.is_active) ? t('settings.restoreProfile') : t('settings.archiveProfile')}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(girl.status === 'archived' || !girl.is_active) ? t('settings.restoreProfileDesc') : t('settings.archiveProfileDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleArchiveToggle}
            disabled={isPending}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition disabled:opacity-50 shrink-0 ${
              (girl.status === 'archived' || !girl.is_active)
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' 
                : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
            }`}
          >
            {(girl.status === 'archived' || !girl.is_active) ? t('settings.restoreActive') : t('settings.archiveProfile')}
          </button>
        </div>

        <div className="h-px bg-zinc-100" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{t('settings.deleteProfile')}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{t('settings.deleteProfileDesc')}</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 shrink-0"
          >
            {t('settings.deleteProfile')}
          </button>
        </div>
      </div>
    </div>
  );
}
