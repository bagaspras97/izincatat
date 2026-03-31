'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Wallet,
  ChevronLeft, ChevronRight, FileDown, CalendarDays,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import BarChart from '@/components/charts/BarChart';
import DoughnutChart, { getKategoriColor } from '@/components/charts/DoughnutChart';
import { formatRupiah } from '@/lib/format';

interface LaporanData {
  labels: string[];
  masuk: number[];
  keluar: number[];
  kategoriKeluar: { nama: string; total: number }[];
  kategoriMasuk:  { nama: string; total: number }[];
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
  prevTotalMasuk: number;
  prevTotalKeluar: number;
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function formatDateLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calcDelta(curr: number, prev: number) {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return { pct: Math.abs(pct).toFixed(0), up: pct >= 0 };
}

export default function LaporanPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data,    setData]    = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  const [periode,   setPeriode]  = useState<'minggu' | 'bulan' | 'tahun' | 'kustom'>('bulan');
  const [navBulan,  setNavBulan] = useState(new Date().getMonth() + 1);
  const [navTahun,  setNavTahun] = useState(new Date().getFullYear());
  const [dateFrom,  setDateFrom] = useState('');
  const [dateTo,    setDateTo]   = useState('');
  const [kategoriView, setKategoriView] = useState<'keluar' | 'masuk'>('keluar');

  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef   = useRef<HTMLInputElement>(null);

  const now          = new Date();
  const today        = now.toISOString().slice(0, 10);
  const isCurrentMonth = navBulan === now.getMonth() + 1 && navTahun === now.getFullYear();
  const isCurrentYear  = navTahun === now.getFullYear();
  const readyToFetch   = periode !== 'kustom' || (!!dateFrom && !!dateTo);

  const getPeriodeLabel = useCallback(() => {
    if (periode === 'minggu') return '7 Hari Terakhir';
    if (periode === 'bulan')  return `${MONTHS[navBulan - 1]} ${navTahun}`;
    if (periode === 'tahun')  return String(navTahun);
    if (dateFrom && dateTo)   return `${formatDateLabel(dateFrom)} – ${formatDateLabel(dateTo)}`;
    return 'Rentang Kustom';
  }, [periode, navBulan, navTahun, dateFrom, dateTo]);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams({ userId, periode });
    if (periode === 'bulan')  { q.set('bulan', String(navBulan)); q.set('tahun', String(navTahun)); }
    if (periode === 'tahun')  q.set('tahun', String(navTahun));
    if (periode === 'kustom') { if (dateFrom) q.set('dateFrom', dateFrom); if (dateTo) q.set('dateTo', dateTo); }
    return q.toString();
  }, [userId, periode, navBulan, navTahun, dateFrom, dateTo]);

  useEffect(() => {
    if (!readyToFetch) { setLoading(false); setData(null); return; }
    setLoading(true);
    fetch(`/api/laporan?${buildQuery()}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [buildQuery, readyToFetch]);

  const handlePrevBulan = () => {
    if (navBulan === 1) { setNavBulan(12); setNavTahun((y) => y - 1); }
    else setNavBulan((m) => m - 1);
  };
  const handleNextBulan = () => {
    if (isCurrentMonth) return;
    if (navBulan === 12) { setNavBulan(1); setNavTahun((y) => y + 1); }
    else setNavBulan((m) => m + 1);
  };

  const activeKategori  = kategoriView === 'keluar' ? (data?.kategoriKeluar ?? []) : (data?.kategoriMasuk ?? []);
  const doughnutLabels  = activeKategori.map((k) => k.nama);
  const doughnutData    = activeKategori.map((k) => k.total);
  const doughnutColors  = activeKategori.map((k) => getKategoriColor(k.nama));
  const totalActive     = kategoriView === 'keluar' ? (data?.totalKeluar ?? 0) : (data?.totalMasuk ?? 0);

  const handleExport = () => {
    if (!data) return;
    const BOM   = '\uFEFF';
    const label = getPeriodeLabel();
    const fmtRp = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const rows: string[][] = [
      ['Laporan Keuangan Izin Catat', label],
      [],
      ['Tanggal', 'Pemasukan (Rp)', 'Pengeluaran (Rp)'],
      ...data.labels.map((l, i) => [l, fmtRp(data.masuk[i]), fmtRp(data.keluar[i])]),
      [],
      ['Ringkasan'],
      ['Total Pemasukan', fmtRp(data.totalMasuk)],
      ['Total Pengeluaran', fmtRp(data.totalKeluar)],
      ['Saldo', fmtRp(data.saldo)],
      [],
      ['Kategori Pengeluaran', 'Total (Rp)', 'Persentase'],
      ...data.kategoriKeluar.map((k) => [
        k.nama,
        fmtRp(k.total),
        data.totalKeluar > 0 ? ((k.total / data.totalKeluar) * 100).toFixed(1) + '%' : '0%',
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `laporan-${label.toLowerCase().replace(/[\s–→]+/g, '-').replace(/[^a-z0-9-]/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sk = 'rounded-xl bg-bg-card-hover animate-pulse';

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Laporan</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Analisa pemasukan &amp; pengeluaran</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || !data}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-card bg-bg-card
            text-text-secondary text-xs font-medium hover:border-accent/40 hover:text-text-primary
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <FileDown size={14} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bento-card mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">

          {/* Tabs */}
          <div className="flex gap-1 bg-bg-primary rounded-xl p-1 border border-border-card shrink-0">
            {([
              { value: 'minggu', label: '7 Hari' },
              { value: 'bulan',  label: 'Bulan'  },
              { value: 'tahun',  label: 'Tahun'  },
              { value: 'kustom', label: 'Kustom' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriode(tab.value)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all
                  ${periode === tab.value ? 'bg-accent text-bg-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bulan navigator */}
          {periode === 'bulan' && (
            <div className="flex items-center gap-1">
              <button onClick={handlePrevBulan} className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-medium text-text-primary min-w-36 text-center">
                {MONTHS[navBulan - 1]} {navTahun}
              </span>
              <button
                onClick={handleNextBulan}
                disabled={isCurrentMonth}
                className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Tahun navigator */}
          {periode === 'tahun' && (
            <div className="flex items-center gap-1">
              <button onClick={() => setNavTahun((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-medium text-text-primary min-w-16 text-center">{navTahun}</span>
              <button
                onClick={() => setNavTahun((y) => y + 1)}
                disabled={isCurrentYear}
                className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Kustom date range */}
          {periode === 'kustom' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => dateFromRef.current?.showPicker()}
                  className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-xs font-medium transition-all
                    ${dateFrom ? 'border-accent/60 bg-accent-dim text-text-primary' : 'border-border-card bg-bg-primary text-text-muted hover:border-accent/30'}`}
                >
                  <CalendarDays size={13} className={dateFrom ? 'text-accent' : 'text-text-muted'} />
                  {dateFrom ? formatDateLabel(dateFrom) : 'Dari tanggal'}
                </button>
                <input ref={dateFromRef} type="date" value={dateFrom} max={dateTo || today}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="absolute inset-0 opacity-0 pointer-events-none" tabIndex={-1} />
              </div>
              <span className="text-text-muted text-xs shrink-0">→</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => dateToRef.current?.showPicker()}
                  className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-xs font-medium transition-all
                    ${dateTo ? 'border-accent/60 bg-accent-dim text-text-primary' : 'border-border-card bg-bg-primary text-text-muted hover:border-accent/30'}`}
                >
                  <CalendarDays size={13} className={dateTo ? 'text-accent' : 'text-text-muted'} />
                  {dateTo ? formatDateLabel(dateTo) : 'Sampai tanggal'}
                </button>
                <input ref={dateToRef} type="date" value={dateTo} min={dateFrom || undefined} max={today}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="absolute inset-0 opacity-0 pointer-events-none" tabIndex={-1} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── SKELETON ── */}
      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bento-card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl shrink-0 ${sk}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 ${sk}`} />
                  <div className={`h-6 w-32 ${sk}`} />
                  <div className={`h-2.5 w-20 ${sk}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bento-card lg:col-span-2 space-y-3">
              <div className={`h-4 w-48 ${sk}`} /><div className={`h-3 w-24 ${sk}`} />
              <div className={`h-55 sm:h-80 w-full ${sk}`} />
            </div>
            <div className="bento-card space-y-3">
              <div className={`h-4 w-36 ${sk}`} /><div className={`h-3 w-24 ${sk}`} />
              <div className={`h-60 sm:h-70 w-full ${sk}`} />
            </div>
          </div>
          <div className="bento-card mt-3 sm:mt-4 p-0! overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-card">
              <div className={`h-4 w-48 ${sk}`} />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${sk}`} /><div className={`h-3.5 w-28 ${sk}`} />
                </div>
                <div className="flex items-center gap-6">
                  <div className={`h-3.5 w-20 ${sk}`} /><div className={`h-3.5 w-16 ${sk}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── EMPTY (kustom belum lengkap) ── */}
      {!loading && !readyToFetch && (
        <div className="bento-card text-center py-16">
          <CalendarDays size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-muted text-sm">Pilih rentang tanggal untuk melihat laporan</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && readyToFetch && !data && (
        <div className="text-center text-text-muted py-20">Gagal memuat laporan</div>
      )}

      {/* ── DATA ── */}
      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">

            {/* Pemasukan */}
            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs text-text-muted">Total Pemasukan</p>
                <p className="text-lg sm:text-xl font-bold text-success truncate">{formatRupiah(data.totalMasuk)}</p>
                {periode !== 'kustom' && (() => {
                  const d = calcDelta(data.totalMasuk, data.prevTotalMasuk);
                  return d ? (
                    <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${d.up ? 'text-success' : 'text-danger'}`}>
                      {d.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {d.pct}% vs sebelumnya
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Pengeluaran */}
            <div className="bento-card flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center shrink-0">
                <TrendingDown size={16} className="text-danger" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs text-text-muted">Total Pengeluaran</p>
                <p className="text-lg sm:text-xl font-bold text-danger truncate">{formatRupiah(data.totalKeluar)}</p>
                {periode !== 'kustom' && (() => {
                  const d = calcDelta(data.totalKeluar, data.prevTotalKeluar);
                  return d ? (
                    <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${d.up ? 'text-danger' : 'text-success'}`}>
                      {d.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {d.pct}% vs sebelumnya
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Saldo */}
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

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Bar chart */}
            <div className="bento-card lg:col-span-2">
              <h2 className="text-base sm:text-lg font-semibold mb-1">Tren Pemasukan vs Pengeluaran</h2>
              <p className="text-text-muted text-[11px] sm:text-xs mb-3 sm:mb-4">{getPeriodeLabel()}</p>
              <div className="h-[220px] sm:h-[320px]">
                {data.labels.length > 0 ? (
                  <BarChart labels={data.labels} masuk={data.masuk} keluar={data.keluar} />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">Belum ada data</div>
                )}
              </div>
            </div>

            {/* Doughnut + masuk/keluar toggle */}
            <div className="bento-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base sm:text-lg font-semibold">Kategori</h2>
                <div className="flex gap-0.5 bg-bg-primary rounded-lg p-0.5 border border-border-card shrink-0">
                  <button
                    onClick={() => setKategoriView('keluar')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all
                      ${kategoriView === 'keluar' ? 'bg-[rgba(248,113,113,0.15)] text-danger' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    <ArrowDownRight size={10} /> Keluar
                  </button>
                  <button
                    onClick={() => setKategoriView('masuk')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all
                      ${kategoriView === 'masuk' ? 'bg-[rgba(74,222,128,0.15)] text-success' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    <ArrowUpRight size={10} /> Masuk
                  </button>
                </div>
              </div>
              <p className="text-text-muted text-[11px] sm:text-xs mb-3 sm:mb-4">{getPeriodeLabel()}</p>
              <div className="h-[240px] sm:h-[280px]">
                {activeKategori.length > 0 ? (
                  <DoughnutChart labels={doughnutLabels} data={doughnutData} colors={doughnutColors} />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">Belum ada data</div>
                )}
              </div>
            </div>

          </div>

          {/* Kategori table */}
          {activeKategori.length > 0 && (
            <div className="bento-card mt-3 sm:mt-4 !p-0 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-card flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-semibold text-text-secondary">
                  Detail Kategori {kategoriView === 'keluar' ? 'Pengeluaran' : 'Pemasukan'}
                </h2>
                <span className="text-[10px] text-text-muted">{getPeriodeLabel()}</span>
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
                    {activeKategori.map((k) => {
                      const persen = totalActive > 0 ? (k.total / totalActive) * 100 : 0;
                      return (
                        <tr key={k.nama} className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors">
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getKategoriColor(k.nama) }} />
                              <span className="text-xs sm:text-sm text-text-primary">{k.nama}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right">
                            <span className={`text-xs sm:text-sm font-medium ${kategoriView === 'keluar' ? 'text-danger' : 'text-success'}`}>
                              {formatRupiah(k.total)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-border-card overflow-hidden">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${persen}%` }} />
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
        </>
      )}

    </div>
  );
}
