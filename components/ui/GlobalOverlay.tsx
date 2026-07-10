'use client';

import React from 'react';
import { useOverlay } from '@/lib/context/OverlayContext';

export default function GlobalOverlay() {
  const { state } = useOverlay();

  if (state === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/30 transition-all duration-300 p-4">
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-pink-100 flex flex-col items-center justify-center w-64 h-56 animate-in fade-in zoom-in-95 duration-200">
        
        {state === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin shadow-sm"></div>
            <p className="mt-6 text-sm font-bold text-zinc-600">Patientez...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-sm">
              ✓
            </div>
            <p className="mt-5 text-sm font-bold text-emerald-700">Succès !</p>
          </div>
        )}
        
      </div>
    </div>
  );
}
