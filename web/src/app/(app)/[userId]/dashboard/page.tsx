import { Wallet, ArrowUpRight, ArrowDownRight, Hash } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import DashboardCharts from './DashboardCharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AggRow = { jenis: string; _sum: { nominal: unknown } };
const sumOf = (rows: AggRow[], jenis: string) =>
  Number(rows.find((r) => r.jenis === jenis)?._sum.nominal ?? 0);

// ─── Page (Server Component) ─────────────────────────────────────────────────

export default async function DashboardPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: publicId } = await params;

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const day0Start  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  // Semua query paralel — satu round-trip ke DB
  const [todayAgg, monthAgg, totalAgg, totalTransaksi, chartRows, rawRecent] =
    await Promise.all([
      prisma.transaksi.groupBy({
        by: ['jenis'],
        where: { user: { publicId }, tanggal: { gte: todayStart, lt: todayEnd } },
        _sum: { nominal: true },
      }),
      prisma.transaksi.groupBy({
        by: ['jenis'],
        where: { user: { publicId }, tanggal: { gte: monthStart, lt: monthEnd } },
        _sum: { nominal: true },
      }),
      prisma.transaksi.groupBy({
        by: ['jenis'],
        where: { user: { publicId } },
        _sum: { nominal: true },
      }),
      prisma.transaksi.count({ where: { user: { publicId } } }),
      prisma.transaksi.findMany({
        where: { user: { publicId }, tanggal: { gte: day0Start, lt: todayEnd } },
        select: { tanggal: true, jenis: true, nominal: true },
      }),
      prisma.transaksi.findMany({
        where: { user: { publicId } },
        orderBy: { tanggal: 'desc' },
        take: 5,
        select: { id: true, jenis: true, nominal: true, keterangan: true, kategori: true, tanggal: true },
      }),
    ]);

  const today = { masuk: sumOf(todayAgg, 'masuk'), keluar: sumOf(todayAgg, 'keluar') };
  const month = { masuk: sumOf(monthAgg, 'masuk'), keluar: sumOf(monthAgg, 'keluar') };
  const total = { masuk: sumOf(totalAgg, 'masuk'), keluar: sumOf(totalAgg, 'keluar') };

  const saldoTotal = total.masuk - total.keluar;
  const saldoBulan = month.masuk - month.keluar;

  // Build last7days array untuk chart
  const last7days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const dayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i) + 1);
    const day      = chartRows.filter((t) => t.tanggal >= dayStart && t.tanggal < dayEnd);
    return {
      tanggal: dayStart.toISOString(),
      masuk:   day.filter((t) => t.jenis === 'masuk').reduce((s, t) => s + Number(t.nominal), 0),
      keluar:  day.filter((t) => t.jenis === 'keluar').reduce((s, t) => s + Number(t.nominal), 0),
    };
  });

  // Dekripsi keterangan server-side
  const recentTransactions = rawRecent.map((t) => ({
    ...t,
    nominal: Number(t.nominal),
    keterangan: decrypt(t.keterangan),
    tanggal: t.tanggal.toISOString(),
  }));

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Ringkasan keuangan kamu</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* ── Saldo Total ──────────────────────────────────── col-span-2 */}
        <div className="bento-card col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-dim flex items-center justify-center">
              <Wallet size={14} className="text-accent sm:hidden" />
              <Wallet size={16} className="text-accent hidden sm:block" />
            </div>
            <span className="text-text-muted text-xs sm:text-sm">Saldo Total</span>
          </div>
          <div>
            <p className={`text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${saldoTotal >= 0 ? 'text-text-primary' : 'text-danger'}`}>
              {formatRupiah(saldoTotal)}
            </p>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 mt-2 sm:mt-4">
              <span className="text-xs sm:text-sm text-text-muted">
                Masuk <span className="text-success font-medium">{formatRupiah(total.masuk)}</span>
              </span>
              <span className="text-xs sm:text-sm text-text-muted">
                Keluar <span className="text-danger font-medium">{formatRupiah(total.keluar)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Masuk Bulan, Keluar Bulan, Bar Chart (Client — butuh Canvas) */}
        <DashboardCharts
          last7days={last7days}
          monthMasuk={month.masuk}
          monthKeluar={month.keluar}
          saldoBulan={saldoBulan}
        />

        {/* ── Transaksi Terakhir ──────────── col-span-2 / lg:col-span-1 */}
        <div className="bento-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-text-secondary">Terakhir</h2>
            <span className="text-xs text-text-muted bg-bg-card-hover px-2 py-0.5 rounded-full">
              {totalTransaksi} total
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {recentTransactions.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">Belum ada transaksi</p>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.jenis === 'masuk' ? 'bg-[rgba(74,222,128,0.12)]' : 'bg-[rgba(248,113,113,0.12)]'}`}>
                    {t.jenis === 'masuk'
                      ? <ArrowUpRight size={14} className="text-success" />
                      : <ArrowDownRight size={14} className="text-danger" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t.keterangan}</p>
                    <p className="text-xs text-text-muted">{t.kategori}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${t.jenis === 'masuk' ? 'text-success' : 'text-danger'}`}>
                      {t.jenis === 'masuk' ? '+' : '-'}{formatRupiah(t.nominal)}
                    </p>
                    <p className="text-[10px] text-text-muted">{formatTanggal(t.tanggal)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Quick Stats Row ───────────────────────────────── 4 × col-1 */}
        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center shrink-0">
            <ArrowUpRight size={16} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Masuk Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-success truncate">{formatRupiah(today.masuk)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center shrink-0">
            <ArrowDownRight size={16} className="text-danger" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Keluar Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-danger truncate">{formatRupiah(today.keluar)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Saldo Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-accent truncate">{formatRupiah(today.masuk - today.keluar)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center shrink-0">
            <Hash size={16} className="text-info" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Total Transaksi</p>
            <p className="text-base sm:text-lg font-bold text-info">{totalTransaksi}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

