"use client";

import { useMemo, useState } from "react";
import { GirlProfileDetail, DailyConsumption } from "@/components/dashboard/girlData";
import Link from "next/link";

interface GirlProfilePageProps {
  profile: GirlProfileDetail;
}

export default function GirlProfilePage({ profile }: GirlProfilePageProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 5;

  const paginatedConsumptions = useMemo(() => {
    const start = pageIndex * itemsPerPage;
    return profile.dailyConsumption.slice(start, start + itemsPerPage);
  }, [pageIndex, profile.dailyConsumption]);

  const pageCount = Math.ceil(profile.dailyConsumption.length / itemsPerPage);
  const currentStats = profile.monthlyStats[0];
  const previousStats = profile.monthlyStats[1];

  const formatCurrency = (value: number) => `${value.toLocaleString()} DZD`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_25px_80px_rgba(236,72,153,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-600">Girl profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-950">{profile.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">Profile details, monthly service use, and current balance overview.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-pink-200 hover:text-pink-700">
            Back to dashboard
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_24px_60px_rgba(236,72,153,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-3xl font-semibold text-pink-700">
                    {profile.initials}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-zinc-950">{profile.name}</p>
                    <p className="text-sm text-zinc-500">{profile.status} · {profile.stayType}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-zinc-500">Current balance</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-700">+{formatCurrency(profile.balance)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-zinc-500">Outstanding debt</p>
                    <p className="mt-2 text-xl font-semibold text-rose-600">-{formatCurrency(profile.debt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-pink-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Joined</p>
                  <p className="mt-2 text-sm text-zinc-700">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-3xl bg-pink-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Phone</p>
                  <p className="mt-2 text-sm text-zinc-700">{profile.phone}</p>
                </div>
                <div className="rounded-3xl bg-pink-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Status</p>
                  <p className="mt-2 text-sm text-zinc-700">{profile.status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_24px_60px_rgba(236,72,153,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Monthly overview</p>
                  <p className="mt-2 text-sm text-zinc-500">Compare this month and last month service consumption.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                  <span className="text-emerald-700">{currentStats.month}</span>
                  <span className="text-zinc-400">|</span>
                  <span>{previousStats.month}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-zinc-500">Income</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950">{formatCurrency(currentStats.income)}</p>
                  <p className="mt-1 text-sm text-zinc-500">Spent {formatCurrency(currentStats.spent)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-zinc-500">Debt</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(currentStats.debt)}</p>
                  <p className="mt-1 text-sm text-zinc-500">Prev. balance {formatCurrency(previousStats.balance)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_24px_60px_rgba(236,72,153,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Service consumption</p>
                  <p className="mt-2 text-sm text-zinc-500">Per day activity with pagination controls.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={pageIndex === 0}
                    className="rounded-full px-3 py-1 text-zinc-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-zinc-500">Page {pageIndex + 1} / {pageCount}</span>
                  <button
                    type="button"
                    onClick={() => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))}
                    disabled={pageIndex >= pageCount - 1}
                    className="rounded-full px-3 py-1 text-zinc-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {paginatedConsumptions.map((daily: DailyConsumption) => (
                  <div key={daily.date} className="rounded-3xl border border-zinc-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{new Date(daily.date).toLocaleDateString()}</p>
                        <p className="text-xs text-zinc-500">{daily.services.length} service(s)</p>
                      </div>
                      <p className="text-sm font-semibold text-pink-700">{formatCurrency(daily.services.reduce((sum, service) => sum + service.amount, 0))}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {daily.services.map((service) => (
                        <div key={service.name} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">{service.name}</p>
                            <p className="text-xs text-zinc-500">{service.category}</p>
                          </div>
                          <p className="text-sm font-semibold text-zinc-700">{formatCurrency(service.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_24px_60px_rgba(236,72,153,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Category breakdown</p>
              <div className="mt-4 space-y-4">
                {profile.serviceCategories.map((category) => (
                  <div key={category.category} className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-zinc-900">{category.category}</p>
                        <p className="text-xs text-zinc-500">{category.count} services this month</p>
                      </div>
                      <p className="font-semibold text-zinc-800">{formatCurrency(category.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-pink-100 bg-white p-6 shadow-[0_24px_60px_rgba(236,72,153,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Quick stats</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active days</p>
                  <p className="mt-2 text-xl font-semibold text-zinc-950">{profile.dailyConsumption.length}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Average spend</p>
                  <p className="mt-2 text-xl font-semibold text-zinc-950">{formatCurrency(Math.round(profile.dailyConsumption.reduce((total, day) => total + day.services.reduce((sum, service) => sum + service.amount, 0), 0) / profile.dailyConsumption.length))}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
