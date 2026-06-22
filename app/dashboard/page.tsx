"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import GirlProfileCard, { GirlProfile } from "@/components/dashboard/GirlProfileCard";
import AddGirlModal from "@/components/dashboard/AddGirlModal";
import { girlProfiles } from "@/components/dashboard/girlData";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<null | { user: any; access_token: string }>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      setSession(data.session);
      setLoading(false);
    };

    loadSession();
  }, [router]);

  const handleAddGirl = (formData: any) => {
    console.log("New girl added:", formData);
    setMessage(`Added ${formData.name} successfully!`);
    setIsAddModalOpen(false);
    // TODO: Send to backend/database
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,182,193,0.28),transparent_33%),linear-gradient(180deg,#fff5fb_0%,#fff_55%,#ffe4f0_100%)] text-zinc-950">
        <div className="mx-auto flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
          <div className="rounded-4xl border border-pink-200/70 bg-white/90 px-10 py-8 shadow-[0_40px_120px_rgba(236,72,153,0.12)] backdrop-blur-xl">
            <p>Checking sign-in status…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,182,193,0.28),transparent_33%),linear-gradient(180deg,#fff5fb_0%,#fff_55%,#ffe4f0_100%)] text-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <section className="rounded-4xl border border-pink-200/70 bg-white/90 p-8 shadow-[0_40px_120px_rgba(236,72,153,0.14)] backdrop-blur-xl sm:p-10">
          <div className="space-y-10">
            

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-pink-600"> Les Filles</p>
                     </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-pink-700 shadow-sm shadow-pink-100/80">
                      {girlProfiles.length + 1} Filles
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-50"
                      title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                    >
                      {viewMode === 'grid' ? (
                        <span>☰ List</span>
                      ) : (
                        <span>⊞ Grid</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'}>
                  {girlProfiles.map((profile) => (
                    <GirlProfileCard
                      key={profile.id}
                      profile={profile}
                      isOpen={openMenu === profile.id}
                      onToggleMenu={(id) => setOpenMenu(openMenu === id ? null : id)}
                      compact={viewMode === 'list'}
                    />
                  ))}

                  <button
                    type="button"
                    className={viewMode === 'grid' ? "flex min-h-52.5 flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-pink-200 bg-white/90 p-8 text-center text-zinc-700 transition hover:border-pink-300 hover:bg-pink-50" : "flex items-center justify-start gap-3 rounded-2xl border border-dashed border-pink-200 bg-white/90 p-4 text-zinc-700 transition hover:border-pink-300 hover:bg-pink-50"}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <div className={viewMode === 'grid' ? "flex h-16 w-16 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-3xl text-pink-700" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-xl text-pink-700"}>
                      +
                    </div>
                    <div className={viewMode === 'list' ? 'text-left' : ''}>
                      <p className={viewMode === 'grid' ? 'text-lg font-semibold' : 'text-sm font-semibold'}>Add girl</p>
                      {viewMode === 'grid' && <p className="text-sm text-zinc-500">Create a new profile card</p>}
                    </div>
                  </button>
                </div>
              </div>
            
          </div>
        </section>
      </div>

      <AddGirlModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddGirl}
      />
    </main>
  );
}
