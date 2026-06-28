export default function SubCategoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-white/50 animate-pulse rounded-lg" />
          <div className="h-6 w-32 bg-white/50 animate-pulse rounded-md" />
        </div>
        
        {/* Item List cart skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-pink-100" />
            ))}
          </div>
          <div className="lg:w-80 h-64 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
        </div>
      </div>
    </div>
  );
}
