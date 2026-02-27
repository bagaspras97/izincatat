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

interface DashboardData {
  today: { masuk: number; keluar: number };
  month: { masuk: number; keluar: number };
  total: { masuk: number; keluar: number };
  last7days: { tanggal: string; masuk: number; keluar: number }[];
  recentTransactions: {
    id: number;
    jenis: string;
    nominal: number;
    keterangan: string;
    kategori: string;
    tanggal: string;
  }[];
  totalTransaksi: number;
}

export default function DashboardPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?userId=${userId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-text-muted py-20">
        Gagal memuat data dashboard
      </div>
    );
  }

  const saldoTotal = data.total.masuk - data.total.keluar;
  const saldoBulan = data.month.masuk - data.month.keluar;
  const sparkMasuk = data.last7days.map((d) => d.masuk);
  const sparkKeluar = data.last7days.map((d) => d.keluar);
  const barLabels = data.last7days.map((d) => formatTanggalSingkat(d.tanggal));
  const barMasuk = data.last7days.map((d) => d.masuk);
  const barKeluar = data.last7days.map((d) => d.keluar);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Ringkasan keuangan kamu</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Card: Saldo Total — SPAN 2 */}
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
                Masuk <span className="text-success font-medium">{formatRupiah(data.total.masuk)}</span>
              </span>
              <span className="text-xs sm:text-sm text-text-muted">
                Keluar <span className="text-danger font-medium">{formatRupiah(data.total.keluar)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card: Pemasukan Bulan Ini */}
        <div className="bento-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(74,222,128,0.12)] flex items-center justify-center">
              <TrendingUp size={14} className="text-success sm:hidden" />
              <TrendingUp size={16} className="text-success hidden sm:block" />
            </div>
            <span className="text-text-muted text-xs sm:text-sm">Masuk (Bulan)</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-success">{formatRupiah(data.month.masuk)}</p>
          <div className="mt-2 sm:mt-3 hidden sm:block">
            <Sparkline data={sparkMasuk} color="#4ADE80" />
          </div>
        </div>

        {/* Card: Pengeluaran Bulan Ini */}
        <div className="bento-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[rgba(248,113,113,0.12)] flex items-center justify-center">
              <TrendingDown size={14} className="text-danger sm:hidden" />
              <TrendingDown size={16} className="text-danger hidden sm:block" />
            </div>
            <span className="text-text-muted text-xs sm:text-sm">Keluar (Bulan)</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-danger">{formatRupiah(data.month.keluar)}</p>
          <div className="mt-2 sm:mt-3 hidden sm:block">
            <Sparkline data={sparkKeluar} color="#F87171" />
          </div>
        </div>

        {/* Card: Chart 7 Hari — SPAN FULL on mobile, 3 on lg */}
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

        {/* Card: Transaksi Terakhir */}
        <div className="bento-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-text-secondary">Terakhir</h2>
            <span className="text-xs text-text-muted bg-bg-card-hover px-2 py-0.5 rounded-full">
              {data.totalTransaksi} total
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {data.recentTransactions.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">Belum ada transaksi</p>
            ) : (
              data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${t.jenis === 'masuk' ? 'bg-[rgba(74,222,128,0.12)]' : 'bg-[rgba(248,113,113,0.12)]'}
                  `}>
                    {t.jenis === 'masuk' ? (
                      <ArrowUpRight size={14} className="text-success" />
                    ) : (
                      <ArrowDownRight size={14} className="text-danger" />
                    )}
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

        {/* Quick Stats Row */}
        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center shrink-0">
            <ArrowUpRight size={16} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Masuk Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-success truncate">{formatRupiah(data.today.masuk)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center shrink-0">
            <ArrowDownRight size={16} className="text-danger" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Keluar Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-danger truncate">{formatRupiah(data.today.keluar)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Saldo Hari Ini</p>
            <p className="text-base sm:text-lg font-bold text-accent truncate">{formatRupiah(data.today.masuk - data.today.keluar)}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center shrink-0">
            <Hash size={16} className="text-info" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-text-muted">Total Transaksi</p>
            <p className="text-base sm:text-lg font-bold text-info">{data.totalTransaksi}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
