'use client';

import { use, useEffect, useState } from 'react';
import DoughnutChart, { getKategoriColor } from '@/components/charts/DoughnutChart';
import { formatRupiah } from '@/lib/format';

interface KategoriItem {
  kategori: string;
  total: number;
  count: number;
  persen: number;
}

export default function KategoriPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data, setData] = useState<KategoriItem[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/kategori?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.data);
        setGrandTotal(json.grandTotal);
      })
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

  const doughnutLabels = data.map((d) => d.kategori);
  const doughnutData = data.map((d) => d.total);
  const doughnutColors = data.map((d) => getKategoriColor(d.kategori));

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Kategori</h1>
        <p className="text-text-muted text-sm mt-1">Breakdown pengeluaran per kategori (bulan ini)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Doughnut */}
        <div className="bento-card lg:col-span-1">
          <h2 className="text-sm font-semibold text-text-secondary mb-2">Distribusi</h2>
          <p className="text-3xl font-bold text-danger mb-4">{formatRupiah(grandTotal)}</p>
          <div className="h-[250px]">
            {data.length > 0 ? (
              <DoughnutChart labels={doughnutLabels} data={doughnutData} colors={doughnutColors} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>

        {/* Category Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.length === 0 ? (
            <div className="bento-card col-span-2 text-center text-text-muted py-12">
              Belum ada transaksi pengeluaran bulan ini
            </div>
          ) : (
            data.map((item) => (
              <div key={item.kategori} className="bento-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getKategoriColor(item.kategori) }}
                    />
                    <span className="text-sm font-medium text-text-primary">{item.kategori}</span>
                  </div>
                  <span className="text-xs text-text-muted">{item.count}x</span>
                </div>
                <p className="text-xl font-bold text-danger mb-2">{formatRupiah(item.total)}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-border-card overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.persen}%`,
                        backgroundColor: getKategoriColor(item.kategori),
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-10 text-right">{item.persen}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
