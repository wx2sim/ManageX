'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { extractBonusBucket } from '@/actions/business_logic';
import { formatDZD } from '@/lib/utils/formatters';

interface ExtractBonusButtonProps {
  girlId: string;
  bucketAmount: number;
}

export default function ExtractBonusButton({ girlId, bucketAmount }: ExtractBonusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExtract = () => {
    if (bucketAmount <= 0) return;
    if (!window.confirm(`Are you sure you want to extract ${formatDZD(bucketAmount)} to the company's instant profit?`)) return;

    setError(null);
    startTransition(async () => {
      const res = await extractBonusBucket(girlId, bucketAmount);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  if (bucketAmount <= 0) return null;

  return (
    <div className="mt-4">
      {error && <p className="text-xs text-rose-600 font-medium mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleExtract}
        disabled={isPending}
        className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        🎁 {isPending ? 'Extracting...' : `Extract ${formatDZD(bucketAmount)} to Profit`}
      </button>
    </div>
  );
}
