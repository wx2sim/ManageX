'use client';

import { FixedPaymentTemplate } from '@/lib/types';
import FixedPaymentForm from '@/components/forms/FixedPaymentForm';

export default function RecurringTab({ girlId, templates }: { girlId: string, templates: FixedPaymentTemplate[] }) {
  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-300">
      <FixedPaymentForm girlId={girlId} templates={templates} />
    </div>
  );
}
