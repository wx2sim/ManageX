'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-8 right-8 z-50" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-4 flex flex-col gap-3 min-w-[200px] animate-in slide-in-from-bottom-4 fade-in duration-200">
          <Link
            href="/stock"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-lg shadow-pink-500/10 transition hover:-translate-y-1 hover:bg-emerald-50 border border-emerald-100"
          >
            <span className="text-xl">🛒</span>
            Market Stock
          </Link>
          <Link
            href="/statistics"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-purple-700 shadow-lg shadow-pink-500/10 transition hover:-translate-y-1 hover:bg-purple-50 border border-purple-100"
          >
            <span className="text-xl">📊</span>
            Financial Overview
          </Link>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-pink-600 text-3xl text-white shadow-xl shadow-pink-600/30 transition-transform duration-300 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-300 ${isOpen ? 'rotate-45 bg-pink-700' : ''}`}
        aria-label="Menu"
      >
        +
      </button>
    </div>
  );
}
