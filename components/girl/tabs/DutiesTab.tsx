'use client';

import DutyForm from '@/components/forms/DutyForm';

export default function DutiesTab({ girlId }: { girlId: string }) {
  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-300">
      <DutyForm girlId={girlId} />
    </div>
  );
}
