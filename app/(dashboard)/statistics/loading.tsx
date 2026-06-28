export default function StatisticsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Global Statistics</h1>
        <div className="h-4 w-64 bg-zinc-200 animate-pulse rounded mt-2" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[1.75rem] border border-pink-100/50" />
        ))}
      </div>
      
      <div className="h-96 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100/50" />
    </div>
  );
}
