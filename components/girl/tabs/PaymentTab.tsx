'use client';

import PaymentForm from '@/components/forms/PaymentForm';

export default function PaymentTab({ girlId }: { girlId: string }) {
  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-300">
      <PaymentForm girlId={girlId} />
    </div>
  );
}
