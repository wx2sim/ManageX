export default function GirlLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-950">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-3xl border border-pink-100" />
          ))}
        </div>
      </div>

      <div className="h-48 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
    </div>
  );
}
