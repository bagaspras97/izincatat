'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  CalendarDays,
  Check,
  X,
  FileDown,
  FilterX,
  SlidersHorizontal,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';

interface Transaksi {
  id: number;
  jenis: string;
  nominal: number;
  keterangan: string;
  kategori: string;
  tanggal: string;
  user: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const KATEGORI_KELUAR = ['Makanan & Minuman', 'Transportasi', 'Belanja Online', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lain-lain'];
const KATEGORI_MASUK  = ['Pendapatan'];

function getKategoriOptions(jenis: string) {
  if (jenis === 'masuk') return KATEGORI_MASUK;
  if (jenis === 'keluar') return KATEGORI_KELUAR;
  return [...KATEGORI_MASUK, ...KATEGORI_KELUAR];
}

function getPillClass(value: string, active: string) {
  if (value !== active) return 'text-text-muted hover:text-text-secondary';
  if (value === 'masuk') return 'bg-[rgba(74,222,128,0.15)] text-success shadow-sm';
  if (value === 'keluar') return 'bg-[rgba(248,113,113,0.15)] text-danger shadow-sm';
  return 'bg-bg-card-hover text-text-primary shadow-sm';
}

function formatDateLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface SelectOption { value: string; label: string; }

function CustomSelect({
  value, options, placeholder, onChange, accent = false,
}: Readonly<{
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (v: string) => void;
  accent?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isActive = accent && !!value;

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 w-full pl-3 pr-3 py-2 rounded-xl border text-xs font-medium transition-colors
          ${isActive
            ? 'border-accent/60 bg-accent-dim text-text-primary'
            : 'border-border-card bg-bg-primary text-text-muted hover:border-accent/30 hover:text-text-secondary'
          }`}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={13} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-max min-w-full bg-bg-card border border-border-card rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full flex items-center justify-between gap-6 px-3 py-2 text-xs hover:bg-bg-card-hover transition-colors text-text-muted whitespace-nowrap"
          >
            <span>{placeholder}</span>
            {!value && <Check size={12} className="text-accent shrink-0" />}
          </button>
          <div className="my-1 border-t border-border-card" />
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-6 px-3 py-2 text-xs hover:bg-bg-card-hover transition-colors whitespace-nowrap
                ${value === o.value ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
            >
              <span>{o.label}</span>
              {value === o.value && <Check size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TransaksiPage({ params }: Readonly<{ params: Promise<{ userId: string }> }>) {
  const { userId } = use(params);
  const [data, setData] = useState<Transaksi[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState<string>('');
  const [kategori, setKategori] = useState<string>('');
  const [sort, setSort] = useState('terbaru');
  const [limit, setLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minDate, setMinDate] = useState(''); // tanggal transaksi pertama user

  const today = new Date().toISOString().slice(0, 10);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef   = useRef<HTMLInputElement>(null);

  const kategoriOptions = getKategoriOptions(jenis);

  // Ambil tanggal transaksi pertama untuk validasi min dateFrom
  useEffect(() => {
    fetch(`/api/transaksi?userId=${userId}&limit=1&sort=terlama`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.[0]?.tanggal) {
          setMinDate(new Date(json.data[0].tanggal).toISOString().slice(0, 10));
        }
      })
      .catch(() => {});
  }, [userId]);

  // Debounce: tunggu 400ms setelah user berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputSearch);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  const fetchData = useCallback(async () => {
    // Pertama kali: loading penuh. Pindah halaman: hanya dim tabel
    if (data.length === 0) {
      setLoading(true);
    } else {
      setFetching(true);
    }
    const queryParams = new URLSearchParams({
      userId: userId,
      page: pagination.page.toString(),
      limit: limit.toString(),
      sort,
    });
    if (jenis) queryParams.set('jenis', jenis);
    if (kategori) queryParams.set('kategori', kategori);
    if (search) queryParams.set('search', search);
    if (dateFrom) queryParams.set('dateFrom', dateFrom);
    if (dateTo) queryParams.set('dateTo', dateTo);

    try {
      const res = await fetch(`/api/transaksi?${queryParams}`);
      const json = await res.json();
      setData(json.data);
      setPagination(json.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [userId, pagination.page, limit, jenis, kategori, sort, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ userId });
      if (jenis)    q.set('jenis', jenis);
      if (kategori) q.set('kategori', kategori);
      if (search)   q.set('search', search);
      if (dateFrom) q.set('dateFrom', dateFrom);
      if (dateTo)   q.set('dateTo', dateTo);

      const res  = await fetch(`/api/transaksi/export?${q}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const parts = ['transaksi'];
      if (jenis === 'masuk')  parts.push('pemasukan');
      if (jenis === 'keluar') parts.push('pengeluaran');
      if (kategori) parts.push(kategori.toLowerCase().replaceAll(/\s+&?\s*/g, '-').replaceAll(/[^a-z0-9-]/g, ''));
      if (dateFrom) parts.push(dateFrom);
      if (dateTo && dateTo !== dateFrom) parts.push(`sd-${dateTo}`);
      if (!dateFrom && !dateTo) parts.push(new Date().toISOString().slice(0, 10));

      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${parts.join('-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-350 mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Transaksi</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Semua catatan pemasukan & pengeluaran</p>
        </div>
        {/* Export CSV + tooltip filter aktif */}
        {(() => {
          const filterLines: string[] = [];
          if (jenis)    filterLines.push(`Jenis: ${jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}`);
          if (kategori) filterLines.push(`Kategori: ${kategori}`);
          if (dateFrom || dateTo) {
            const dari   = dateFrom ? formatDateLabel(dateFrom) : '—';
            const sampai = dateTo   ? formatDateLabel(dateTo)   : '—';
            filterLines.push(`Periode: ${dari} → ${sampai}`);
          }
          if (search) filterLines.push(`Pencarian: "${search}"`);
          const tooltipTitle = filterLines.length > 0 ? 'Filter aktif' : 'Semua transaksi';

          return (
            <div className="relative group shrink-0">
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-card bg-bg-card
                  text-text-secondary text-xs font-medium hover:border-accent/40 hover:text-text-primary
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {exporting
                  ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <FileDown size={14} />
                }
                <span className="hidden sm:inline">{exporting ? 'Mengekspor...' : 'Export CSV'}</span>
              </button>

              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-2 z-50 pointer-events-none
                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {/* Caret */}
                <div className="absolute right-4 bottom-full w-2.5 h-2.5 -mb-1.25 rotate-45
                  bg-bg-card border-l border-t border-border-card" />
                <div className="bg-bg-card border border-border-card rounded-xl shadow-lg px-3 py-2.5 min-w-44 max-w-56">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    {tooltipTitle}
                  </p>
                  {filterLines.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {filterLines.map((line) => (
                        <li key={line} className="flex items-start gap-1.5 text-xs text-text-secondary whitespace-nowrap">
                          <span className="text-accent mt-px">•</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-secondary">Tidak ada filter aktif,<br/>semua data akan diekspor.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Toolbar */}
      <div className="bento-card mb-4 space-y-4">

        {/* Search + toggle filter (mobile) */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari keterangan atau kategori..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-primary border border-border-card
                text-text-primary text-sm placeholder:text-text-muted
                focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          {/* Toggle filter — hanya mobile */}
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors shrink-0
              ${filterOpen || jenis || kategori || dateFrom || dateTo
                ? 'border-accent/60 bg-accent-dim text-accent'
                : 'border-border-card bg-bg-primary text-text-muted'
              }`}
          >
            <SlidersHorizontal size={14} />
            {(jenis || kategori || dateFrom || dateTo) && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* Filter row — selalu tampil di desktop, toggle di mobile */}
        <div className={`flex-col sm:flex sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-x-6 sm:gap-y-3
          ${filterOpen ? 'flex' : 'hidden sm:flex'}`}>

          {/* Tampilkan (jenis) — pill toggle */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Tampilkan</p>
            <div className="flex w-full sm:w-auto rounded-xl border border-border-card bg-bg-primary p-0.5 gap-0.5">
              {([
                { value: '', label: 'Semua', Icon: null },
                { value: 'masuk', label: 'Masuk', Icon: ArrowUpRight },
                { value: 'keluar', label: 'Keluar', Icon: ArrowDownRight },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setJenis(value);
                    // Reset kategori jika tidak valid untuk jenis baru
                    const invalidKategori =
                      (value === 'masuk' && KATEGORI_KELUAR.includes(kategori)) ||
                      (value === 'keluar' && KATEGORI_MASUK.includes(kategori));
                    if (invalidKategori) setKategori('');
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all ${getPillClass(value, jenis)}`}
                >
                  {Icon && <Icon size={12} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Kategori</p>
            <CustomSelect
              value={kategori}
              options={kategoriOptions.map((k) => ({ value: k, label: k }))}
              placeholder="Semua kategori"
              accent
              onChange={(v) => { setKategori(v); setPagination((p) => ({ ...p, page: 1 })); }}
            />
          </div>

          {/* Periode — custom date trigger buttons */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Periode</p>
            <div className="flex items-center gap-2">

              {/* Dari */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => dateFromRef.current?.showPicker()}
                  className={`w-full flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-xs font-medium transition-all
                    ${dateFrom
                      ? 'border-accent/60 bg-accent-dim text-text-primary'
                      : 'border-border-card bg-bg-primary text-text-muted hover:border-accent/30 hover:text-text-secondary'
                    }`}
                >
                  <CalendarDays size={13} className={dateFrom ? 'text-accent' : 'text-text-muted'} />
                  <span className="truncate">
                    {dateFrom ? formatDateLabel(dateFrom) : 'Dari tanggal'}
                  </span>
                </button>
                <input
                  ref={dateFromRef}
                  type="date"
                  value={dateFrom}
                  min={minDate || undefined}
                  max={dateTo || today}
                  onChange={(e) => { setDateFrom(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  className="absolute inset-0 opacity-0 pointer-events-none w-full"
                  tabIndex={-1}
                />
              </div>

              <span className="text-text-muted text-xs select-none shrink-0">→</span>

              {/* Sampai */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => dateToRef.current?.showPicker()}
                  className={`w-full flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-xs font-medium transition-all
                    ${dateTo
                      ? 'border-accent/60 bg-accent-dim text-text-primary'
                      : 'border-border-card bg-bg-primary text-text-muted hover:border-accent/30 hover:text-text-secondary'
                    }`}
                >
                  <CalendarDays size={13} className={dateTo ? 'text-accent' : 'text-text-muted'} />
                  <span className="truncate">
                    {dateTo ? formatDateLabel(dateTo) : 'Sampai tanggal'}
                  </span>
                </button>
                <input
                  ref={dateToRef}
                  type="date"
                  value={dateTo}
                  min={dateFrom || minDate || undefined}
                  max={today}
                  onChange={(e) => { setDateTo(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  className="absolute inset-0 opacity-0 pointer-events-none w-full"
                  tabIndex={-1}
                />
              </div>

              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setPagination((p) => ({ ...p, page: 1 })); }}
                  title="Hapus filter tanggal"
                  className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Urutkan */}
          <div className="sm:ml-auto">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Urutkan</p>
            <CustomSelect
              value={sort}
              options={[
                { value: 'terbaru', label: 'Terbaru' },
                { value: 'terlama', label: 'Terlama' },
                { value: 'terbesar', label: 'Nominal terbesar' },
                { value: 'terkecil', label: 'Nominal terkecil' },
              ]}
              placeholder="Urutkan"
              onChange={setSort}
            />
          </div>

        </div>
      </div>

      {/* Active filter strip */}
      {(inputSearch || jenis || kategori || dateFrom || dateTo) && (() => {
        const activeFilters = [
          inputSearch && `Pencarian: "${inputSearch}"`,
          jenis && (jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'),
          kategori,
          (dateFrom || dateTo) && `${dateFrom ? formatDateLabel(dateFrom) : '—'} → ${dateTo ? formatDateLabel(dateTo) : '—'}`,
        ].filter(Boolean) as string[];

        return (
          <div className="flex items-center justify-between gap-3 px-4 py-2 mb-4 rounded-xl bg-accent-dim border border-accent/20">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterX size={13} className="text-accent shrink-0" />
              <span className="text-xs text-text-secondary font-medium">
                {activeFilters.length} filter aktif:
              </span>
              {activeFilters.map((f) => (
                <span key={f} className="text-xs text-text-secondary bg-bg-card border border-border-card px-2 py-0.5 rounded-lg">
                  {f}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                setInputSearch('');
                setJenis('');
                setKategori('');
                setDateFrom('');
                setDateTo('');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors shrink-0"
            >
              <X size={12} />
              Reset
            </button>
          </div>
        );
      })()}

      {/* Table */}
      <div className="bento-card overflow-hidden p-0!">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-text-muted py-20">
            Tidak ada transaksi ditemukan
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-card">
                  <th className="text-left text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">ID</th>
                  <th className="text-left text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4">Jenis</th>
                  <th className="text-left text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4">Keterangan</th>
                  <th className="text-left text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">Kategori</th>
                  <th className="text-right text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4">Nominal</th>
                  <th className="text-right text-xs font-medium text-text-muted px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className="text-xs text-text-muted font-mono">#{t.id}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className={`
                        inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium
                        ${t.jenis === 'masuk'
                          ? 'bg-[rgba(74,222,128,0.12)] text-success'
                          : 'bg-[rgba(248,113,113,0.12)] text-danger'
                        }
                      `}>
                        {t.jenis === 'masuk' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span className="hidden sm:inline">{t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-text-primary truncate max-w-30 sm:max-w-none">{t.keterangan}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 sm:hidden">{formatTanggal(t.tanggal)}</p>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <span className="text-xs text-text-secondary bg-bg-card-hover px-2.5 py-1 rounded-lg">
                        {t.kategori}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <span className={`text-xs sm:text-sm font-medium ${t.jenis === 'masuk' ? 'text-success' : 'text-danger'}`}>
                        {t.jenis === 'masuk' ? '+' : '-'}{formatRupiah(t.nominal)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-text-muted">{formatTanggal(t.tanggal)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-border-card">
          {/* Info + per-page */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs text-text-muted">
              {pagination.total === 0
                ? 'Tidak ada data'
                : `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} dari ${pagination.total} transaksi`
              }
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-2 py-1 rounded-lg bg-bg-primary border border-border-card text-text-secondary text-xs focus:outline-none focus:border-accent/50"
            >
              <option value={10}>10 / hal</option>
              <option value={20}>20 / hal</option>
              <option value={50}>50 / hal</option>
            </select>
          </div>

          {/* Page controls */}
          {pagination.totalPages > 0 && (
            <div className="flex items-center gap-1">
              {/* First */}
              <button
                onClick={() => goToPage(1)}
                disabled={pagination.page <= 1}
                title="Halaman pertama"
                className="p-1.5 rounded-lg hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} className="text-text-secondary" />
              </button>
              {/* Prev */}
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-text-secondary" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`
                      w-8 h-8 rounded-lg text-xs font-medium transition-colors
                      ${pageNum === pagination.page
                        ? 'bg-accent text-bg-primary'
                        : 'text-text-muted hover:bg-bg-card-hover'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-text-secondary" />
              </button>
              {/* Last */}
              <button
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                title="Halaman terakhir"
                className="p-1.5 rounded-lg hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} className="text-text-secondary" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
