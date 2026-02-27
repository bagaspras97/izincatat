'use client';

import { use, useEffect, useState, useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Filter,
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

export default function TransaksiPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data, setData] = useState<Transaksi[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState<string>('');
  const [sort, setSort] = useState('terbaru');
  const [limit, setLimit] = useState(20);

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
    if (search) queryParams.set('search', search);

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
  }, [userId, pagination.page, limit, jenis, sort, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Transaksi</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Semua catatan pemasukan & pengeluaran</p>
      </div>

      {/* Toolbar */}
      <div className="bento-card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-primary border border-border-card
                text-text-primary text-sm placeholder:text-text-muted
                focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Filter Jenis */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select
              value={jenis}
              onChange={(e) => {
                setJenis(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2.5 rounded-xl bg-bg-primary border border-border-card
                text-text-primary text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="">Semua</option>
              <option value="masuk">Pemasukan</option>
              <option value="keluar">Pengeluaran</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-bg-primary border border-border-card
                text-text-primary text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="terbesar">Terbesar</option>
              <option value="terkecil">Terkecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden !p-0">
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
                      <p className="text-xs sm:text-sm text-text-primary truncate max-w-[120px] sm:max-w-none">{t.keterangan}</p>
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
