'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'gun'>('camera');
  const [camError, setCamError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    if (mode !== 'camera') return;

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | null = null;
    const lastCode = { value: '', ts: 0 };

    const startScanner = async () => {
      try {
        setCamError(null);
        const videoEl = videoRef.current;
        if (!videoEl) return;
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoEl,
          (result) => {
            if (!result) return;
            const code = result.getText().trim();
            const now = Date.now();
            if (code === lastCode.value && now - lastCode.ts < 2000) return;
            lastCode.value = code;
            lastCode.ts = now;
            if (isMounted) onScanRef.current(code);
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.message?.includes('https') || err?.name === 'NotAllowedError') {
          setCamError('La caméra nécessite HTTPS. Testez en production.');
        } else {
          setCamError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
      }
    };

    const timer = setTimeout(() => { if (isMounted) startScanner(); }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      try { controls?.stop(); } catch {}
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'gun') inputRef.current?.focus();
  }, [mode]);

  const handleGunInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val) onScan(val);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200 pointer-events-auto mx-auto my-auto mt-[10vh]">
      <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold">&times;</button>

      <h2 className="text-xl font-bold text-zinc-900 mb-6">Scanner Produit</h2>

      <div className="flex gap-2 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200/60 mb-6">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'camera' ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          📷 Camera
        </button>
        <button
          type="button"
          onClick={() => setMode('gun')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'gun' ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          🔫 Scanner USB
        </button>
      </div>

      <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30 overflow-hidden relative">
        {mode === 'camera' ? (
          camError ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <p className="text-sm font-bold text-red-700 mb-2">Erreur Caméra</p>
              <p className="text-xs text-red-600/80">{camError}</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full" onClick={() => inputRef.current?.focus()}>
            <div className="text-4xl mb-4 animate-bounce">⚡</div>
            <p className="text-sm font-bold text-emerald-800">Prêt à scanner</p>
            <p className="text-xs text-emerald-600/70 mt-2">Pointez votre scanner USB/Bluetooth vers un code-barres.</p>
            <input
              ref={inputRef}
              type="text"
              onKeyDown={handleGunInput}
              onBlur={() => { if (mode === 'gun') inputRef.current?.focus(); }}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
