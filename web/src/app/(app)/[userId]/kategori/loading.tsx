const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-bg-card-hover ${className ?? ''}`} />
);

export default function KategoriLoading() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <Sk className="h-7 w-28 mb-2" />
        <Sk className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Doughnut */}
        <div className="bento-card lg:col-span-1">
          <Sk className="h-4 w-24 mb-2" />
          <Sk className="h-9 w-40 mb-4" />
          <Sk className="h-[250px] w-full" />
        </div>

        {/* Category Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bento-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sk className="w-3 h-3 rounded-full shrink-0" />
                  <Sk className="h-3 w-24" />
                </div>
                <Sk className="h-3 w-6" />
              </div>
              <Sk className="h-7 w-32" />
              <div className="flex items-center gap-2">
                <Sk className="flex-1 h-1.5 rounded-full" />
                <Sk className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
