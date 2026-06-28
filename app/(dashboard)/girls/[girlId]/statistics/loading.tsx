export default function GirlStatisticsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-24 bg-white/50 animate-pulse rounded-3xl border border-pink-100" />
        <div className="h-24 bg-white/50 animate-pulse rounded-3xl border border-pink-100" />
      </div>

      <div className="h-96 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
    </div>
  );
}
