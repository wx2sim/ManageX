"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TimePeriod = "day" | "week" | "month";

export default function StatisticsPage() {
  const router = useRouter();
  const [session, setSession] = useState<null | { user: any; access_token: string }>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [pickedUpAmount, setPickedUpAmount] = useState(5000);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupInput, setPickupInput] = useState(pickedUpAmount.toString());

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

  // Mock data based on time period
  const getMockData = () => {
    const data = {
      day: { income: 12500, expenses: 8200, profit: 4300 },
      week: { income: 78300, expenses: 45600, profit: 32700 },
      month: { income: 325600, expenses: 182400, profit: 143200 },
    };
    return data[timePeriod];
  };

  const mockData = getMockData();
  const monthlyProfit = 143200;
  const totalGain = mockData.income;
  const totalSpent = mockData.expenses;
  const remainingProfit = monthlyProfit - pickedUpAmount;

  const handlePickupUpdate = () => {
    const newAmount = parseInt(pickupInput);
    if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= monthlyProfit) {
      setPickedUpAmount(newAmount);
      setShowPickupModal(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,182,193,0.28),transparent_33%),linear-gradient(180deg,#fff5fb_0%,#fff_55%,#ffe4f0_100%)] text-zinc-950">
        <div className="mx-auto flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
          <div className="rounded-4xl border border-pink-200/70 bg-white/90 px-10 py-8 shadow-[0_40px_120px_rgba(236,72,153,0.12)] backdrop-blur-xl">
            <p>Loading statistics…</p>
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
            {/* Header */}
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-pink-600">Statistics</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
                Financial Overview
              </h1>
            </div>

            {/* Time Period Filter */}
            <div className="flex gap-3">
              {(["day", "week", "month"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${
                    timePeriod === period
                      ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                      : "border border-pink-200 bg-white text-pink-700 hover:bg-pink-50"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Total Income */}
              <div className="rounded-4xl border border-pink-100 bg-linear-to-br from-emerald-50 to-green-50 p-6 shadow-sm shadow-emerald-200/40">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Total Income</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-900">
                  {totalGain.toLocaleString()} DZD
                </p>
                <p className="mt-2 text-xs text-emerald-600">
                  {timePeriod === "day"
                    ? "Today's earnings"
                    : timePeriod === "week"
                      ? "This week's earnings"
                      : "This month's earnings"}
                </p>
              </div>

              {/* Total Expenses */}
              <div className="rounded-4xl border border-pink-100 bg-linear-to-br from-rose-50 to-red-50 p-6 shadow-sm shadow-rose-200/40">
                <p className="text-sm uppercase tracking-[0.3em] text-rose-700">Total Spent</p>
                <p className="mt-4 text-3xl font-semibold text-rose-900">
                  {totalSpent.toLocaleString()} DZD
                </p>
                <p className="mt-2 text-xs text-rose-600">
                  {timePeriod === "day"
                    ? "Today's expenses"
                    : timePeriod === "week"
                      ? "This week's expenses"
                      : "This month's expenses"}
                </p>
              </div>

              {/* Profit */}
              <div className="rounded-4xl border border-pink-100 bg-linear-to-br from-blue-50 to-indigo-50 p-6 shadow-sm shadow-blue-200/40">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-700">Profit</p>
                <p className="mt-4 text-3xl font-semibold text-blue-900">
                  {mockData.profit.toLocaleString()} DZD
                </p>
                <p className="mt-2 text-xs text-blue-600">
                  {((mockData.profit / totalGain) * 100).toFixed(1)}% margin
                </p>
              </div>
            </div>

            {/* Monthly Profit Section */}
            <div className="rounded-4xl border border-pink-200 bg-linear-to-br from-pink-50 to-rose-50 p-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-pink-700">Monthly Profit</p>
                  <p className="mt-4 text-4xl font-semibold text-pink-950">{monthlyProfit.toLocaleString()} DZD</p>
                  <p className="mt-3 text-sm text-pink-600">Total profit generated this month</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-4 border border-pink-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-pink-600">Picked Up</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-950">{pickedUpAmount.toLocaleString()} DZD</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 border border-pink-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-pink-600">Remaining</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-950">{remainingProfit.toLocaleString()} DZD</p>
                  </div>
                  <button
                    onClick={() => setShowPickupModal(true)}
                    className="w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700"
                  >
                    Update Picked Up Amount
                  </button>
                </div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-4xl border border-pink-100 bg-pink-50 p-8 shadow-sm shadow-pink-200/40">
                <p className="text-sm uppercase tracking-[0.35em] text-pink-600">Income Trend</p>
                <div className="mt-6 flex h-40 items-end justify-around gap-2">
                  {[65, 72, 81, 88, 92, 85, 90].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 rounded-t-lg bg-linear-to-t from-emerald-500 to-emerald-400 transition hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs text-pink-600">Last 7 days average</p>
              </div>

              <div className="rounded-4xl border border-pink-100 bg-pink-50 p-8 shadow-sm shadow-pink-200/40">
                <p className="text-sm uppercase tracking-[0.35em] text-pink-600">Expense Trend</p>
                <div className="mt-6 flex h-40 items-end justify-around gap-2">
                  {[45, 52, 48, 55, 62, 58, 50].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 rounded-t-lg bg-linear-to-t from-rose-500 to-rose-400 transition hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs text-pink-600">Last 7 days average</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Pickup Amount Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-pink-200 bg-white shadow-[0_20px_100px_rgba(236,72,153,0.2)]">
            <div className="flex items-center justify-between border-b border-pink-100 p-5">
              <h2 className="text-xl font-semibold text-zinc-950">Update Pickup Amount</h2>
              <button
                onClick={() => setShowPickupModal(false)}
                className="text-lg text-zinc-400 transition hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-950">Available: {monthlyProfit.toLocaleString()} DZD</p>
                <input
                  type="number"
                  value={pickupInput}
                  onChange={(e) => setPickupInput(e.target.value)}
                  max={monthlyProfit}
                  min="0"
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePickupUpdate}
                  className="flex-1 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
