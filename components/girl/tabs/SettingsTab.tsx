'use client';

import { GirlBalance } from '@/lib/types';
import SettingsForm from '@/components/forms/SettingsForm';

export default function SettingsTab({ girl }: { girl: GirlBalance }) {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      <SettingsForm girl={girl} />
    </div>
  );
}
