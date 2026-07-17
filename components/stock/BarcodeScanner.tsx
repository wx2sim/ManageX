'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'gun'>('camera');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (mode === 'camera') {
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 150 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          if (scanner) {
            scanner.clear();
          }
          onScan(decodedText);
        },
        (error) => {
          // Ignore scanning errors as they happen constantly during scanning
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [mode, onScan]);

  useEffect(() => {
    if (mode === 'gun') {
      // Focus the hidden input to capture gun scanner keystrokes
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleGunInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val) {
        onScan(val);
      }
      e.currentTarget.value = ''; // Reset for next scan
    }
  };

  // Click anywhere in gun mode to keep focus
  const handleGunContainerClick = () => {
    if (mode === 'gun') {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200 pointer-events-auto mx-auto my-auto mt-[10vh]">
      <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 text-2xl font-bold">&times;</button>
      
      <h2 className="text-xl font-bold text-zinc-900 mb-6">Scan Product</h2>

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
          🔫 Scanner
        </button>
      </div>

      <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30 overflow-hidden relative" onClick={handleGunContainerClick}>
        {mode === 'camera' ? (
          <div id="reader" className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
            <div className="text-4xl mb-4 animate-bounce">⚡</div>
            <p className="text-sm font-bold text-emerald-800">Ready to Scan</p>
            <p className="text-xs text-emerald-600/70 mt-2">Point your USB/Bluetooth scanner at a barcode.</p>
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
