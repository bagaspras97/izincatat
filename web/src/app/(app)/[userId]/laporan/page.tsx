'use client';

import { use, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import BarChart from '@/components/charts/BarChart';
import DoughnutChart, { getKategoriColor } from '@/components/charts/DoughnutChart';
import { formatRupiah } from '@/lib/format';

interface LaporanData {
  labels: string[];
  masuk: number[];
  keluar: number[];
  kategori: { nama: string; total: number }[];
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
}

const PERIODES = [
  { value: 'minggu', label: '7 Hari' },
  { value: 'bulan', label: 'Bulan Ini' },
  { value: 'tahun', label: 'Tahun Ini' },
];

export default function LaporanPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('bulan');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/laporan?userId=${userId}&periode=${periode}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, periode]);

  const doughnutLabels = data?.kategori.map((k) => k.nama) ?? [];
  const doughnutData = data?.kategori.map((k) => k.total) ?? [];
  const doughnutColors = data?.kategori.map((k) => getKategoriColor(k.nama)) ?? [];

  const sk = 'rounded-xl bg-bg-card-hover animate-pulse';

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header — selalu tampil, period selector tetap interaktif saat loading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Laporan</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Analisa pemasukan & pengeluaran</p>
        </div>
        {/* Period Selector */}
        <div className="flex gap-1 bg-bg-card rounded-xl p-1 border border-border-card">
          {PERIODES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${periode === p.value ? 'bg-accent text-bg-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SKELETON ── */}
      {loading && (
        <>
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bento-card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl shrink-0 ${sk}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 ${sk}`} />
                  <div className={`h-6 w-32 ${sk}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts row skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bento-card lg:col-span-2 space-y-3">
              <div className={`h-4 w-48 ${sk}`} />
              <div className={`h-3 w-24 ${sk}`} />
              <div className={`h-55 sm:h-80 w-full ${sk}`} />
            </div>
            <div className="bento-card space-y-3">
              <div className={`h-4 w-36 ${sk}`} />
              <div className={`h-3 w-24 ${sk}`} />
              <div className={`h-60 sm:h-70 w-full ${sk}`} />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bento-card mt-3 sm:mt-4 p-0! overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-card">
              <div className={`h-4 w-48 ${sk}`} />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${sk}`} />
                  <div className={`h-3.5 w-28 ${sk}`} />
                </div>
                <div className="flex items-center gap-6">
                  <div className={`h-3.5 w-20 ${sk}`} />
                  <div className={`h-3.5 w-16 ${sk}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ERROR ── */}
      {!loading && !data && (
        <div className="text-center text-text-muted py-20">Gagal memuat laporan</div>
      )}

      {/* ── DATA ── */}
      {!loading && data && <>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Total Pemasukan</p>
            <p className="text-lg sm:text-xl font-bold text-success truncate">{formatRupiah(data.totalMasuk)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center shrink-0">
            <TrendingDown size={16} className="text-danger" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Total Pengeluaran</p>
            <p className="text-lg sm:text-xl font-bold text-danger truncate">{formatRupiah(data.totalKeluar)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Saldo Periode</p>
            <p className={`text-lg sm:text-xl font-bold truncate ${data.saldo >= 0 ? 'text-accent' : 'text-danger'}`}>
              {formatRupiah(data.saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Bar Chart */}
        <div className="bento-card lg:col-span-2">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Tren Pemasukan vs Pengeluaran</h2>
          <p className="text-text-muted text-[11px] sm:text-xs mb-3 sm:mb-4">
            {PERIODES.find((p) => p.value === periode)?.label}
          </p>
          <div className="h-[220px] sm:h-[320px]">
            {data.labels.length > 0 ? (
              <BarChart labels={data.labels} masuk={data.masuk} keluar={data.keluar} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bento-card">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Kategori Pengeluaran</h2>
          <p className="text-text-muted text-[11px] sm:text-xs mb-3 sm:mb-4">
            {PERIODES.find((p) => p.value === periode)?.label}
          </p>
          <div className="h-[240px] sm:h-[280px]">
            {data.kategori.length > 0 ? (
              <DoughnutChart labels={doughnutLabels} data={doughnutData} colors={doughnutColors} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kategori Table */}
      {data.kategori.length > 0 && (
        <div className="bento-card mt-3 sm:mt-4 !p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-card">
            <h2 className="text-xs sm:text-sm font-semibold text-text-secondary">Detail Kategori Pengeluaran</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card">
                <th className="text-left text-xs font-medium text-text-muted px-4 sm:px-6 py-3">Kategori</th>
                <th className="text-right text-xs font-medium text-text-muted px-4 sm:px-6 py-3">Total</th>
                <th className="text-right text-xs font-medium text-text-muted px-4 sm:px-6 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {data.kategori.map((k) => {
                const persen = data.totalKeluar > 0 ? (k.total / data.totalKeluar) * 100 : 0;
                return (
                  <tr key={k.nama} className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: getKategoriColor(k.nama) }}
                        />
                        <span className="text-xs sm:text-sm text-text-primary">{k.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <span className="text-xs sm:text-sm font-medium text-danger">{formatRupiah(k.total)}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-border-card overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-10 text-right">{persen.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
