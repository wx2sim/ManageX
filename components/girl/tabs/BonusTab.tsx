'use client';

import BonusForm from '@/components/forms/BonusForm';

export default function BonusTab({ girlId }: { girlId: string }) {
  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-300">
      <BonusForm girlId={girlId} />
    </div>
  );
}
