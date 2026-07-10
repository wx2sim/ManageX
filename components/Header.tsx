"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguage } from "@/components/LanguageProvider";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'ar-DZ', {
        month: "long",
        day: "numeric",
      }).format(new Date())
    );
  }, [language]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleAvatarClick = () => {
    if (session) {
      if (pathname !== "/") {
        router.push("/");
      }
      return;
    }

    router.push("/login");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-white/85 backdrop-blur-xl shadow-sm shadow-pink-200/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 shadow-sm shadow-pink-200/50">
            <span className="text-lg font-semibold">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-600">{t('header.managex')}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-full border border-pink-200/70 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 shadow-sm shadow-pink-100/80" suppressHydrationWarning>
            {today}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
            className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 border border-zinc-200 shadow-sm"
          >
            {language === 'fr' ? '🇩🇿 AR' : '🇫🇷 FR'}
          </button>
          {session ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex rounded-2xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700"
            >
              {t('header.signOut')}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleAvatarClick}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-700 shadow-sm shadow-pink-200/40 transition hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-300/70"
            aria-label={session ? "Open dashboard" : "Open login"}
          >
            <span className="text-base font-semibold">{initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
