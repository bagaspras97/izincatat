// loading.tsx — otomatis ditampilkan Next.js saat SSR page.tsx sedang diproses server.
// Struktur grid sama persis dengan page.tsx agar tidak ada layout shift saat konten muncul.

const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-bg-card-hover ${className ?? ''}`} />
);

export default function DashboardLoading() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6 sm:mb-8">
        <Sk className="h-7 w-32 mb-2" />
        <Sk className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Saldo Total */}
        <div className="bento-card col-span-2">
          <div className="space-y-3">
            <Sk className="h-3 w-1/4" />
            <Sk className="h-10 w-2/3" />
            <div className="flex gap-6">
              <Sk className="h-3 w-24" />
              <Sk className="h-3 w-24" />
            </div>
          </div>
        </div>

        {/* Masuk Bulan */}
        <div className="bento-card">
          <div className="space-y-3">
            <Sk className="h-3 w-1/2" />
            <Sk className="h-8 w-3/4" />
            <Sk className="h-10 w-full hidden sm:block" />
          </div>
        </div>

        {/* Keluar Bulan */}
        <div className="bento-card">
          <div className="space-y-3">
            <Sk className="h-3 w-1/2" />
            <Sk className="h-8 w-3/4" />
            <Sk className="h-10 w-full hidden sm:block" />
          </div>
        </div>

        {/* Bar Chart 7 Hari */}
        <div className="bento-card col-span-2 lg:col-span-3">
          <div className="space-y-2 mb-4">
            <Sk className="h-4 w-36" />
            <Sk className="h-2.5 w-24" />
          </div>
          <Sk className="w-full h-[200px] sm:h-[280px]" />
        </div>

        {/* Transaksi Terakhir */}
        <div className="bento-card col-span-2 lg:col-span-1">
          <Sk className="h-3 w-1/3 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sk className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Sk className="h-3 w-3/4" />
                  <Sk className="h-2.5 w-1/2" />
                </div>
                <Sk className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Row */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bento-card flex items-center gap-3 sm:gap-4">
            <Sk className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-2.5 w-2/3" />
              <Sk className="h-5 w-1/2" />
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
