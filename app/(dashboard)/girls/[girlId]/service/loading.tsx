export default function GirlServiceLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
      
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white/50 animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-3xl border border-pink-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
