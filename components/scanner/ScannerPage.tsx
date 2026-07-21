'use client';

import { useEffect, useRef, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Item, ServiceCategory, ServiceSubcategory } from '@/lib/types';
import { addMarketInput } from '@/actions/market_logic';
import { uploadProductImage } from '@/lib/cloudinary';
import { formatDZD } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

interface ScannerPageProps {
  items: Item[];
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  profileId?: string;
}

type SheetState = 'hidden' | 'found' | 'new';

const PREDEFINED_ICONS = [
  '🛍️', '💧', '🥤', '🍔', '🍕', '🌭', '🥪', '🚬', '💊', '🧴',
  '💄', '🧻', '🧼', '📦', '📱', '🔋', '🥩', '🧅', '🥔', '🍅',
];

const UNITS = ['unit', 'piece', 'g', 'kg', 'ml', 'l'];

export default function ScannerPage({ items, categories, subcategories, profileId }: ScannerPageProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<{ code: string; ts: number }>({ code: '', ts: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const [mode, setMode] = useState<'camera' | 'usb' | 'phone'>('camera');
  const [camError, setCamError] = useState<string | null>(null);
  const [frameColor, setFrameColor] = useState<'white' | 'green'>('white');
  const [cameraReady, setCameraReady] = useState(false);

  // Sync state
  const channelRef = useRef<any>(null);
  const [otherDevicesCount, setOtherDevicesCount] = useState(0);
  const [totalScannedCount, setTotalScannedCount] = useState(0);
  const [lastScannedStatus, setLastScannedStatus] = useState<{ code: string; ts: number; validated: boolean; productName?: string } | null>(null);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState<string | null>(null);

  // Sheet state
  const [sheetState, setSheetState] = useState<SheetState>('hidden');
  const [scannedCode, setScannedCode] = useState('');
  const [foundItem, setFoundItem] = useState<Item | null>(null);

  // Form state — Restock (found item)
  const [restockQty, setRestockQty] = useState('1');
  const [restockBuyPrice, setRestockBuyPrice] = useState('');
  const [restockSellPrice, setRestockSellPrice] = useState('');
  const [restockDate, setRestockDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form state — New item
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'finished' | 'raw_material'>('finished');
  const [newUnit, setNewUnit] = useState('unit');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSubcategoryId, setNewSubcategoryId] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newSellPrice, setNewSellPrice] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newIcon, setNewIcon] = useState('🛍️');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Submit state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- PROCESS BARCODE ---
  const processBarcode = useCallback((code: string) => {
    // Flash frame green
    setFrameColor('green');
    setTimeout(() => setFrameColor('white'), 800);

    if (mode === 'phone') {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'barcode_scanned',
          payload: { code, scanned_at: Date.now() }
        });
      }
      setTotalScannedCount(c => c + 1);
      setLastScannedStatus({ code, ts: Date.now(), validated: false });
      return;
    }

    setScannedCode(code);
    setError(null);

    const found = items.find(
      i => i.barcode?.trim() === code ||
        (i.alternate_barcodes && i.alternate_barcodes.some(b => b.trim() === code))
    );

    if (found) {
      setFoundItem(found);
      setRestockQty('1');
      setRestockBuyPrice(found.cost_price.toString());
      setRestockSellPrice(found.sell_price.toString());
      setRestockDate(new Date().toISOString().split('T')[0]);
      setSheetState('found');
    } else {
      setFoundItem(null);
      setNewName('');
      setNewType('finished');
      setNewUnit('unit');
      setNewCategoryId('');
      setNewSubcategoryId('');
      setNewBuyPrice('');
      setNewSellPrice('');
      setNewQty('1');
      setNewIcon('🛍️');
      setNewImageFile(null);
      setNewImagePreview(null);
      setSheetState('new');
    }
  }, [items, mode]);

  // --- ZXING CAMERA ---
  useEffect(() => {
    if (mode !== 'camera' && mode !== 'phone') return;

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let controls: { stop: () => void } | null = null;

    const start = async () => {
      try {
        setCamError(null);
        const videoEl = videoRef.current;
        if (!videoEl) return;

        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoEl,
          (result) => {
            if (!result || !isMounted) return;
            const code = result.getText().trim();
            const now = Date.now();
            if (code === lastScannedRef.current.code && now - lastScannedRef.current.ts < 2000) return;
            lastScannedRef.current = { code, ts: now };
            processBarcode(code);
          }
        );
        if (isMounted) setCameraReady(true);
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.name === 'NotAllowedError' || err?.message?.includes('https')) {
          setCamError('La caméra nécessite HTTPS. Testez depuis la version déployée en production.');
        } else {
          setCamError("Impossible d'accéder à la caméra. Vérifiez les permissions dans votre navigateur.");
        }
      }
    };

    const timer = setTimeout(start, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      try { controls?.stop(); } catch {}
      codeReaderRef.current = null;
    };
  }, [mode, processBarcode]);

  useEffect(() => {
    if (!profileId) return;

    const supabase = createClient();
    const channel = supabase.channel(`scanner-${profileId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'barcode_scanned' }, ({ payload }) => {
        // Laptop receiver mode: process barcode from phone
        if (mode !== 'phone' && payload?.code) {
          processBarcode(payload.code);
        }
      })
      .on('broadcast', { event: 'scan_validated' }, ({ payload }) => {
        // Phone sender mode: receive validation success
        if (mode === 'phone') {
          setLastScannedStatus(prev => {
            if (prev && prev.code === payload?.code) {
              return { ...prev, validated: true, productName: payload?.product_name };
            }
            return prev;
          });
          setPhoneSuccessMsg(`Validé: ${payload?.product_name || payload?.code}`);
          setTimeout(() => setPhoneSuccessMsg(null), 1500);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOtherDevicesCount(Math.max(0, count - 1));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), type: mode });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [profileId, mode, processBarcode]);

  // USB gun mode
  useEffect(() => {
    if (mode === 'usb') inputRef.current?.focus();
  }, [mode]);

  const handleGunKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val) processBarcode(val);
      e.currentTarget.value = '';
    }
  };

  const dismissSheet = () => {
    setSheetState('hidden');
    setError(null);
    lastScannedRef.current = { code: '', ts: 0 };
  };

  // --- SUBMIT RESTOCK ---
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundItem) return;
    setError(null);
    startTransition(async () => {
      const res = await addMarketInput({
        item_id: foundItem.id,
        quantity: Number(restockQty),
        unit_buy_price: Number(restockBuyPrice),
        unit_sell_price: Number(restockSellPrice),
        shopping_date: new Date(restockDate).toISOString(),
      });
      if (res?.error) {
        setError(res.error);
      } else {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'scan_validated',
            payload: { code: scannedCode, product_name: foundItem.name }
          });
        }
        setSuccessMsg('✅ Stock mis à jour !');
        setTimeout(() => setSuccessMsg(null), 2500);
        dismissSheet();
      }
    });
  };

  // --- SUBMIT NEW ITEM ---
  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setError('Le nom du produit est requis'); return; }
    if (!newBuyPrice) { setError('Le prix d\'achat est requis'); return; }
    setError(null);
    startTransition(async () => {
      let imageUrl: string | null = null;
      if (newImageFile) {
        try {
          imageUrl = await uploadProductImage(newImageFile);
        } catch {
          setError("Échec de l'upload de l'image");
          return;
        }
      }
      const res = await addMarketInput({
        name: newName.trim(),
        item_type: newType,
        unit: newType === 'raw_material' ? newUnit : 'unit',
        subcategory_id: newSubcategoryId || undefined,
        image_url: imageUrl,
        icon: imageUrl ? null : newIcon,
        barcode: scannedCode,
        quantity: Number(newQty),
        unit_buy_price: Number(newBuyPrice),
        unit_sell_price: newType === 'finished' ? Number(newSellPrice) : 0,
        shopping_date: new Date(newDate).toISOString(),
      });
      if (res?.error) {
        setError(res.error);
      } else {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'scan_validated',
            payload: { code: scannedCode, product_name: newName.trim() }
          });
        }
        setSuccessMsg(`✅ "${newName}" ajouté au stock !`);
        setTimeout(() => setSuccessMsg(null), 2500);
        dismissSheet();
      }
    });
  };

  const filteredSubcats = subcategories.filter(s => s.category_id === newCategoryId);

  const sheetOpen = mode !== 'phone' && sheetState !== 'hidden';

  return (
    <div className="fixed inset-0 flex flex-col bg-black select-none">

      {/* ══ CAMERA ZONE (top, grows to fill remaining space) ══ */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: sheetOpen ? '40%' : '100%', maxHeight: sheetOpen ? '40%' : '100%', transition: 'min-height 0.4s cubic-bezier(0.32,0.72,0,1), max-height 0.4s cubic-bezier(0.32,0.72,0,1)' }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Mode tabs */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/50 backdrop-blur-md rounded-full p-1">
          <button
            onClick={() => setMode('camera')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${mode === 'camera' ? 'bg-white text-zinc-900' : 'text-white/70 hover:text-white'}`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => setMode('usb')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${mode === 'usb' ? 'bg-white text-zinc-900' : 'text-white/70 hover:text-white'}`}
          >
            🔫 Scanner USB
          </button>
          <button
            onClick={() => setMode('phone')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${mode === 'phone' ? 'bg-white text-zinc-900' : 'text-white/70 hover:text-white'}`}
          >
            📱 Téléphone
          </button>
        </div>

        {/* Video element — always in DOM so ZXing can attach */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${(mode === 'camera' || mode === 'phone') ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          autoPlay
          playsInline
          muted
        />

        {/* USB mode overlay */}
        {mode === 'usb' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 cursor-pointer"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="text-6xl mb-4 animate-bounce">⚡</div>
            <p className="text-white font-bold text-lg">Prêt à scanner</p>
            <p className="text-white/50 text-sm mt-2">Pointez votre scanner USB / Bluetooth</p>
            <input
              ref={inputRef}
              type="text"
              onKeyDown={handleGunKey}
              onBlur={() => { if (mode === 'usb') inputRef.current?.focus(); }}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
            />
          </div>
        )}

        {/* Camera error */}
        {(mode === 'camera' || mode === 'phone') && camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-6 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-white font-bold text-base mb-2">Caméra inaccessible</p>
            <p className="text-white/60 text-sm">{camError}</p>
          </div>
        )}

        {/* Scanning frame overlay */}
        {(mode === 'camera' || mode === 'phone') && !camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="relative"
              style={{
                width: 240,
                height: 140,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Corner brackets */}
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 ${cls}`}
                  style={{ borderColor: frameColor === 'green' ? '#22c55e' : 'white', transition: 'border-color 0.3s ease' }}
                />
              ))}

              {/* Scanning line animation */}
              {frameColor === 'white' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scan-line" style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'rgba(255,255,255,0.7)',
                    animation: 'scanLine 1.8s ease-in-out infinite',
                  }} />
                </div>
              )}

              {/* Green detected overlay */}
              {frameColor === 'green' && (
                <div className="absolute inset-0 rounded-lg border-2 border-green-400 bg-green-400/10 flex items-center justify-center">
                  <div className="text-green-400 text-3xl font-bold">✓</div>
                </div>
              )}
            </div>
            <p className="text-white/70 text-xs mt-4 font-medium tracking-wide">
              {sheetOpen ? '✅ Code-barres détecté' : 'Pointez vers le code-barres'}
            </p>
          </div>
        )}

        {/* Phone sync overlay status card */}
        {mode === 'phone' && (
          <div className="absolute bottom-10 left-4 right-4 bg-zinc-950/80 backdrop-blur-md rounded-3xl p-5 border border-zinc-800 text-white flex flex-col gap-4 max-w-sm mx-auto shadow-2xl animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-zinc-100 uppercase">Mode Téléphone</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Appareil de scan uniquement</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className={`w-2 h-2 rounded-full ${otherDevicesCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold text-zinc-200">
                  {otherDevicesCount > 0 ? `Connecté — ${otherDevicesCount} reçu(s)` : 'Aucun appareil connecté'}
                </span>
              </div>
            </div>

            {lastScannedStatus ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Dernier scan</p>
                  <div className="flex items-center justify-between mt-1 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-mono text-sm text-zinc-200">{lastScannedStatus.code}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lastScannedStatus.validated ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/25 text-amber-400 border border-amber-500/30'}`}>
                      {lastScannedStatus.validated ? '✅ Validé' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
                {lastScannedStatus.productName && (
                  <p className="text-xs font-bold text-emerald-400 animate-pulse">
                    Produit: {lastScannedStatus.productName}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-400">Pointez la caméra pour commencer à envoyer</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/30 p-2.5 rounded-xl">
              <span>Total scannés:</span>
              <span className="font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-md">{totalScannedCount}</span>
            </div>
          </div>
        )}

        {/* Success toast */}
        {(successMsg || phoneSuccessMsg) && (
          <div className={`absolute left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in duration-300 ${mode === 'phone' ? 'top-20 slide-in-from-top-4' : 'bottom-4 slide-in-from-bottom-4'}`}>
            {successMsg || phoneSuccessMsg}
          </div>
        )}
      </div>

      {/* ══ BOTTOM SHEET ══ */}
      <div
        className="relative bg-white overflow-hidden flex-shrink-0"
        style={{
          height: sheetOpen ? '60%' : '0%',
          transition: 'height 0.4s cubic-bezier(0.32,0.72,0,1)',
          borderRadius: sheetOpen ? '28px 28px 0 0' : '0',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-full pb-8 px-5">

          {/* Hidden hint */}
          {!sheetOpen && (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-400 text-sm">🔍 Pointez vers le code-barres...</p>
            </div>
          )}

          {/* ── FOUND product ── */}
          {sheetState === 'found' && foundItem && (
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {/* Product thumbnail */}
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200">
                    {foundItem.image_url?.startsWith('http') || foundItem.image_url?.startsWith('/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foundItem.image_url} alt={foundItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{foundItem.icon || foundItem.image_url || '🛍️'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Produit trouvé</span>
                    </div>
                    <h3 className="font-bold text-zinc-900 text-base leading-tight mt-0.5">{foundItem.name}</h3>
                    <p className="text-xs text-zinc-500">Stock actuel: <strong>{foundItem.stock_quantity}</strong> {foundItem.unit}</p>
                  </div>
                </div>
                <button type="button" onClick={dismissSheet} className="text-zinc-400 hover:text-zinc-700 text-2xl font-light leading-none">×</button>
              </div>

              <div className="text-xs text-zinc-400 font-mono bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                Barcode: {scannedCode}
              </div>

              {/* Quantity stepper */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Quantité à ajouter</label>
                <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl border border-zinc-200 p-2">
                  <button
                    type="button"
                    onClick={() => setRestockQty(q => Math.max(1, Number(q) - 1).toString())}
                    className="w-10 h-10 rounded-xl bg-white border border-zinc-200 font-bold text-xl flex items-center justify-center hover:bg-zinc-100 transition"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    required
                    className="flex-1 text-center text-xl font-bold bg-transparent border-none outline-none text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setRestockQty(q => (Number(q) + 1).toString())}
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center hover:bg-emerald-700 transition"
                  >+</button>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Prix achat /u</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={restockBuyPrice}
                    onChange={e => setRestockBuyPrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="DZD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Prix vente /u</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={restockSellPrice}
                    onChange={e => setRestockSellPrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="DZD"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Date d&apos;achat</label>
                <input
                  type="date"
                  value={restockDate}
                  onChange={e => setRestockDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-xl">{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition text-base flex items-center justify-center gap-2"
              >
                {isPending ? '⏳ Mise à jour...' : '✅ Valider le réapprovisionnement'}
              </button>
            </form>
          )}

          {/* ── NEW product ── */}
          {sheetState === 'new' && (
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">➕ Nouveau produit</span>
                  <p className="text-xs text-zinc-400 font-mono mt-1">{scannedCode}</p>
                </div>
                <button type="button" onClick={dismissSheet} className="text-zinc-400 hover:text-zinc-700 text-2xl font-light leading-none">×</button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Nom du produit *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  placeholder="ex: Eau minérale 1.5L"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Type toggle */}
              <div className="flex gap-2">
                {(['finished', 'raw_material'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${newType === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-zinc-600 border-zinc-200'}`}
                  >
                    {t === 'finished' ? '🛍️ Produit fini' : '🧪 Matière première'}
                  </button>
                ))}
              </div>

              {/* Unit (raw material only) */}
              {newType === 'raw_material' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Unité</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Catégorie</label>
                <select
                  value={newCategoryId}
                  onChange={e => { setNewCategoryId(e.target.value); setNewSubcategoryId(''); }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="">— Aucune —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              {/* Subcategory */}
              {filteredSubcats.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Sous-catégorie</label>
                  <select
                    value={newSubcategoryId}
                    onChange={e => setNewSubcategoryId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="">— Aucune —</option>
                    {filteredSubcats.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Prix achat *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={newBuyPrice}
                    onChange={e => setNewBuyPrice(e.target.value)}
                    required
                    placeholder="DZD"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Prix vente</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={newSellPrice}
                    onChange={e => setNewSellPrice(e.target.value)}
                    disabled={newType === 'raw_material'}
                    placeholder={newType === 'raw_material' ? 'N/A' : 'DZD'}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-400 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Quantité</label>
                <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl border border-zinc-200 p-2">
                  <button
                    type="button"
                    onClick={() => setNewQty(q => Math.max(1, Number(q) - 1).toString())}
                    className="w-10 h-10 rounded-xl bg-white border border-zinc-200 font-bold text-xl flex items-center justify-center hover:bg-zinc-100 transition"
                  >−</button>
                  <input
                    type="number" min="1"
                    value={newQty}
                    onChange={e => setNewQty(e.target.value)}
                    required
                    className="flex-1 text-center text-xl font-bold bg-transparent border-none outline-none text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setNewQty(q => (Number(q) + 1).toString())}
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center hover:bg-emerald-700 transition"
                  >+</button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">Date d&apos;achat</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Icon / Photo */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Photo / Icône</label>
                {newImagePreview ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newImagePreview} alt="preview" className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-zinc-700">Image sélectionnée</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setNewImageFile(null); setNewImagePreview(null); }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-4 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl cursor-pointer transition text-sm font-semibold text-zinc-700">
                      📷 Prendre une photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setNewImageFile(f);
                            setNewImagePreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                    {/* Quick emoji grid */}
                    <div className="flex flex-wrap gap-1.5">
                      {PREDEFINED_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewIcon(icon)}
                          className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition ${newIcon === icon ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-zinc-50 hover:bg-zinc-100'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-xl">{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition text-base flex items-center justify-center gap-2"
              >
                {isPending ? '⏳ Enregistrement...' : '✅ Valider et ajouter au stock'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* CSS animation for scan line */}
      <style jsx global>{`
        @keyframes scanLine {
          0%   { top: 0%; opacity: 1; }
          50%  { top: 100%; opacity: 0.6; }
          100% { top: 0%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
