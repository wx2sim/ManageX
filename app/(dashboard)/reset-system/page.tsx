'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { resetAllHistory } from '@/actions/reset';
import { useOverlayTransition } from '@/lib/context/OverlayContext';

export default function ResetSystemPage() {
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useOverlayTransition();
  const router = useRouter();

  const handleReset = () => {
    if (confirmText !== 'RESET') {
      alert('Veuillez taper RESET pour confirmer.');
      return;
    }

    startTransition(async () => {
      const res = await resetAllHistory();
      if (res?.error) {
        alert('Erreur: ' + res.error);
      } else {
        alert('Le système a été réinitialisé avec succès.');
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-[2rem] border border-rose-200 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-4xl mb-4">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Réinitialisation du Système</h1>
        <p className="text-sm text-zinc-600">
          Attention ! Cette action est <strong>IRRÉVERSIBLE</strong>.<br/><br/>
          Elle supprimera <strong>TOUT L'HISTORIQUE</strong> (tous les paiements, toutes les transactions, toutes les dettes, tous les achats en stock, et toutes les statistiques).<br/>
          Les profils (filles), le catalogue de produits, et les modèles de charges resteront intacts, mais le stock sera remis à Zéro (0).
        </p>

        <div className="w-full mt-8 space-y-4 text-left">
          <label className="block text-sm font-bold text-zinc-700">
            Tapez <span className="text-rose-600">RESET</span> ci-dessous pour confirmer :
          </label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-center font-bold tracking-widest text-zinc-900 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
          />

          <button
            onClick={handleReset}
            disabled={isPending || confirmText !== 'RESET'}
            className="w-full mt-4 rounded-xl bg-rose-600 px-4 py-4 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Suppression en cours...' : 'SUPPRIMER TOUT L\'HISTORIQUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
