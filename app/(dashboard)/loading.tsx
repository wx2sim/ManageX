export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-pink-600 font-bold opacity-50">Les Filles</p>
        <div className="h-9 w-64 bg-zinc-200 animate-pulse rounded-md mt-1" />
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-52 bg-white/50 animate-pulse rounded-[1.75rem] border border-pink-100/50" />
        ))}
      </div>
    </div>
  );
}
