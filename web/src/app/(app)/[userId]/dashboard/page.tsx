'use client';

import { use, useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Hash,
} from 'lucide-react';
import Sparkline from '@/components/charts/Sparkline';
import BarChart from '@/components/charts/BarChart';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SummaryData {
  today: { masuk: number; keluar: number };
  month: { masuk: number; keluar: number };
  total: { masuk: number; keluar: number };
  totalTransaksi: number;
}

interface ChartData {
  last7days: { tanggal: string; masuk: number; keluar: number }[];
}

interface RecentData {
  recentTransactions: {
    id: number;
    jenis: string;
    nominal: number;
    keterangan: string;
    kategori: string;
    tanggal: string;
  }[];
}

// ─── Skeleton primitif ───────────────────────────────────────────────────────

const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-bg-card-hover ${className ?? ''}`} />
);

const SkStatCard = () => (
  <div className="bento-card flex items-center gap-3 sm:gap-4">
    <Sk className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Sk className="h-2.5 w-2/3" />
      <Sk className="h-5 w-1/2" />
    </div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [chart, setChart]     = useState<ChartData | null>(null);
  const [recent, setRecent]   = useState<RecentData | null>(null);

  useEffect(() => {
    const q = `?userId=${userId}`;
    fetch(`/api/dashboard/summary${q}`).then((r) => r.ok ? r.json() : null).then((d) => d && setSummary(d)).catch(console.error);
    fetch(`/api/dashboard/chart${q}`).then((r) => r.ok ? r.json() : null).then((d) => d && setChart(d)).catch(console.error);
    fetch(`/api/dashboard/recent${q}`).then((r) => r.ok ? r.json() : null).then((d) => d && setRecent(d)).catch(console.error);
  }, [userId]);

  const saldoTotal = summary ? summary.total.masuk - summary.total.keluar : 0;
  const saldoBulan = summary ? summary.month.masuk - summary.month.keluar : 0;
  const barLabels  = chart?.last7days.map((d) => formatTanggalSingkat(d.tanggal)) ?? [];
  const barMasuk   = chart?.last7days.map((d) => d.masuk) ?? [];
  const barKeluar  = chart?.last7days.map((d) => d.keluar) ?? [];
  const sparkMasuk  = chart?.last7days.map((d) => d.masuk) ?? [];
  const sparkKeluar = chart?.last7days.map((d) => d.keluar) ?? [];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Ringkasan keuangan kamu</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* ── Saldo Total ──────────────────────────────────── col-span-2 */}
        {!summary ? (
          <div className="bento-card col-span-2">
            <div className="animate-pulse space-y-3">
              <Sk className="h-3 w-1/4" />
              <Sk className="h-10 w-2/3" />
              <div className="flex gap-6 mt-1">
                <Sk className="h-3 w-24" />
                <Sk className="h-3 w-24" />
              </div>
            </div>
          </div>
        ) : (
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
                  Masuk <span className="text-success font-medium">{formatRupiah(summary.total.masuk)}</span>
                </span>
                <span className="text-xs sm:text-sm text-text-muted">
                  Keluar <span className="text-danger font-medium">{formatRupiah(summary.total.keluar)}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Masuk Bulan ───────────────────────────────────── col-span-1 */}
        {!summary ? (
          <div className="bento-card">
            <div className="animate-pulse space-y-3">
              <Sk className="h-3 w-1/2" />
              <Sk className="h-8 w-3/4" />
              <Sk className="h-10 w-full hidden sm:block" />
            </div>
          </div>
        ) : (
          <div className="bento-card flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(74,222,128,0.12)] flex items-center justify-center">
                <TrendingUp size={14} className="text-success sm:hidden" />
                <TrendingUp size={16} className="text-success hidden sm:block" />
              </div>
              <span className="text-text-muted text-xs sm:text-sm">Masuk (Bulan)</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-success">{formatRupiah(summary.month.masuk)}</p>
            <div className="mt-2 sm:mt-3 hidden sm:block">
              {chart ? <Sparkline data={sparkMasuk} color="#4ADE80" /> : <Sk className="h-10 w-full" />}
            </div>
          </div>
        )}

        {/* ── Keluar Bulan ──────────────────────────────────── col-span-1 */}
        {!summary ? (
          <div className="bento-card">
            <div className="animate-pulse space-y-3">
              <Sk className="h-3 w-1/2" />
              <Sk className="h-8 w-3/4" />
              <Sk className="h-10 w-full hidden sm:block" />
            </div>
          </div>
        ) : (
          <div className="bento-card flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(248,113,113,0.12)] flex items-center justify-center">
                <TrendingDown size={14} className="text-danger sm:hidden" />
                <TrendingDown size={16} className="text-danger hidden sm:block" />
              </div>
              <span className="text-text-muted text-xs sm:text-sm">Keluar (Bulan)</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-danger">{formatRupiah(summary.month.keluar)}</p>
            <div className="mt-2 sm:mt-3 hidden sm:block">
              {chart ? <Sparkline data={sparkKeluar} color="#F87171" /> : <Sk className="h-10 w-full" />}
            </div>
          </div>
        )}

        {/* ── Bar Chart 7 Hari ──────────────── col-span-2 / lg:col-span-3 */}
        {!chart ? (
          <div className="bento-card col-span-2 lg:col-span-3">
            <div className="animate-pulse space-y-2 mb-4">
              <Sk className="h-4 w-36" />
              <Sk className="h-2.5 w-24" />
            </div>
            <Sk className="w-full h-[200px] sm:h-[280px]" />
          </div>
        ) : (
          <div className="bento-card col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">7 Hari Terakhir</h2>
                <p className="text-text-muted text-[11px] sm:text-xs mt-0.5">Pemasukan vs Pengeluaran</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-text-muted">Saldo Bulan</p>
                <p className={`text-base sm:text-lg font-bold ${saldoBulan >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {summary ? formatRupiah(saldoBulan) : '...'}
                </p>
              </div>
            </div>
            <div className="h-[200px] sm:h-[280px]">
              <BarChart labels={barLabels} masuk={barMasuk} keluar={barKeluar} />
            </div>
          </div>
        )}

        {/* ── Transaksi Terakhir ──────────── col-span-2 / lg:col-span-1 */}
        {!recent ? (
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
        ) : (
          <div className="bento-card col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-semibold text-text-secondary">Terakhir</h2>
              {summary && (
                <span className="text-xs text-text-muted bg-bg-card-hover px-2 py-0.5 rounded-full">
                  {summary.totalTransaksi} total
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {recent.recentTransactions.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">Belum ada transaksi</p>
              ) : (
                recent.recentTransactions.map((t) => (
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Quick Stats Row ───────────────────────────────── 4 × col-1 */}
        {!summary ? (
          <>
            <SkStatCard />
            <SkStatCard />
            <SkStatCard />
            <SkStatCard />
          </>
        ) : (
          <>
            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} className="text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-text-muted">Masuk Hari Ini</p>
                <p className="text-base sm:text-lg font-bold text-success truncate">{formatRupiah(summary.today.masuk)}</p>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center shrink-0">
                <ArrowDownRight size={16} className="text-danger" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-text-muted">Keluar Hari Ini</p>
                <p className="text-base sm:text-lg font-bold text-danger truncate">{formatRupiah(summary.today.keluar)}</p>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-text-muted">Saldo Hari Ini</p>
                <p className="text-base sm:text-lg font-bold text-accent truncate">{formatRupiah(summary.today.masuk - summary.today.keluar)}</p>
              </div>
            </div>

            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center shrink-0">
                <Hash size={16} className="text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-text-muted">Total Transaksi</p>
                <p className="text-base sm:text-lg font-bold text-info">{summary.totalTransaksi}</p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
