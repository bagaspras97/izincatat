'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from '@/components/charts/Sparkline';
import BarChart from '@/components/charts/BarChart';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';

interface Props {
  last7days: { tanggal: string; masuk: number; keluar: number }[];
  monthMasuk: number;
  monthKeluar: number;
  saldoBulan: number;
}

/**
 * Client Component: hanya bagian yang butuh Canvas API (Chart.js).
 * Menerima data yang sudah di-fetch di Server Component induknya.
 * Merender 3 grid items: Masuk Bulan, Keluar Bulan, Bar Chart 7 Hari.
 */
export default function DashboardCharts({ last7days, monthMasuk, monthKeluar, saldoBulan }: Props) {
  const sparkMasuk  = last7days.map((d) => d.masuk);
  const sparkKeluar = last7days.map((d) => d.keluar);
  const barLabels   = last7days.map((d) => formatTanggalSingkat(d.tanggal));
  const barMasuk    = last7days.map((d) => d.masuk);
  const barKeluar   = last7days.map((d) => d.keluar);

  return (
    <>
      {/* ── Masuk Bulan + Sparkline ────────────────────────── col-span-1 */}
      <div className="bento-card flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(74,222,128,0.12)] flex items-center justify-center">
            <TrendingUp size={14} className="text-success sm:hidden" />
            <TrendingUp size={16} className="text-success hidden sm:block" />
          </div>
          <span className="text-text-muted text-xs sm:text-sm">Masuk (Bulan)</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-success">{formatRupiah(monthMasuk)}</p>
        <div className="mt-2 sm:mt-3 hidden sm:block">
          <Sparkline data={sparkMasuk} color="#4ADE80" />
        </div>
      </div>

      {/* ── Keluar Bulan + Sparkline ───────────────────────── col-span-1 */}
      <div className="bento-card flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(248,113,113,0.12)] flex items-center justify-center">
            <TrendingDown size={14} className="text-danger sm:hidden" />
            <TrendingDown size={16} className="text-danger hidden sm:block" />
          </div>
          <span className="text-text-muted text-xs sm:text-sm">Keluar (Bulan)</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-danger">{formatRupiah(monthKeluar)}</p>
        <div className="mt-2 sm:mt-3 hidden sm:block">
          <Sparkline data={sparkKeluar} color="#F87171" />
        </div>
      </div>

      {/* ── Bar Chart 7 Hari ──────────────── col-span-2 / lg:col-span-3 */}
      <div className="bento-card col-span-2 lg:col-span-3">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">7 Hari Terakhir</h2>
            <p className="text-text-muted text-[11px] sm:text-xs mt-0.5">Pemasukan vs Pengeluaran</p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-text-muted">Saldo Bulan</p>
            <p className={`text-base sm:text-lg font-bold ${saldoBulan >= 0 ? 'text-accent' : 'text-danger'}`}>
              {formatRupiah(saldoBulan)}
            </p>
          </div>
        </div>
        <div className="h-[200px] sm:h-[280px]">
          <BarChart labels={barLabels} masuk={barMasuk} keluar={barKeluar} />
        </div>
      </div>
    </>
  );
}
