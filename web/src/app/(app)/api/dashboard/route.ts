import { NextRequest, NextResponse } from 'next/server';
import prisma, { resolveUserId } from '@/lib/prisma';

type AggRow = { jenis: string; _sum: { nominal: unknown } };
const sumOf = (rows: AggRow[], jenis: string) =>
  Number(rows.find((r) => r.jenis === jenis)?._sum.nominal ?? 0);

/**
 * GET /api/dashboard?userId=clxyz...
 * Ambil data ringkasan untuk halaman dashboard.
 *
 * Optimasi: 23 query serial → 7 query (6 parallel setelah resolveUserId).
 * - today/month/total → groupBy jenis (2 queries → 3 groupBy)
 * - sparkline 7 hari → 1 findMany + aggregasi di JS (was: 14 queries serial)
 * - recentTransactions + count → tetap 2 queries, dijalankan paralel
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = await resolveUserId(searchParams.get('userId'));

    const userFilter = userId ? { userId } : {};

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const day0Start  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    // Semua query dijalankan paralel sekaligus
    const [todayAgg, monthAgg, totalAgg, last7raw, recentTransactions, totalTransaksi] =
      await Promise.all([
        // today — 1 groupBy menggantikan 2 aggregate
        prisma.transaksi.groupBy({
          by: ['jenis'],
          where: { ...userFilter, tanggal: { gte: todayStart, lt: todayEnd } },
          _sum: { nominal: true },
        }),
        // bulan ini — 1 groupBy menggantikan 2 aggregate
        prisma.transaksi.groupBy({
          by: ['jenis'],
          where: { ...userFilter, tanggal: { gte: monthStart, lt: monthEnd } },
          _sum: { nominal: true },
        }),
        // sepanjang masa — 1 groupBy menggantikan 2 aggregate
        prisma.transaksi.groupBy({
          by: ['jenis'],
          where: userFilter,
          _sum: { nominal: true },
        }),
        // 7 hari terakhir — 1 findMany menggantikan 14 query serial dalam loop
        prisma.transaksi.findMany({
          where: { ...userFilter, tanggal: { gte: day0Start, lt: todayEnd } },
          select: { tanggal: true, jenis: true, nominal: true },
        }),
        // 5 transaksi terakhir
        prisma.transaksi.findMany({
          where: userFilter,
          orderBy: { tanggal: 'desc' },
          take: 5,
          select: {
            id: true,
            jenis: true,
            nominal: true,
            keterangan: true,
            kategori: true,
            tanggal: true,
          },
        }),
        // Total count
        prisma.transaksi.count({ where: userFilter }),
      ]);

    // Aggregasi sparkline 7 hari di sisi aplikasi (bukan DB)
    const last7days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const dayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i) + 1);
      const dayRows  = last7raw.filter((t) => t.tanggal >= dayStart && t.tanggal < dayEnd);
      return {
        tanggal: dayStart,
        masuk:  dayRows.filter((t) => t.jenis === 'masuk').reduce((s, t) => s + Number(t.nominal), 0),
        keluar: dayRows.filter((t) => t.jenis === 'keluar').reduce((s, t) => s + Number(t.nominal), 0),
      };
    });

    return NextResponse.json({
      today:  { masuk: sumOf(todayAgg, 'masuk'),  keluar: sumOf(todayAgg, 'keluar') },
      month:  { masuk: sumOf(monthAgg, 'masuk'),  keluar: sumOf(monthAgg, 'keluar') },
      total:  { masuk: sumOf(totalAgg, 'masuk'),  keluar: sumOf(totalAgg, 'keluar') },
      last7days,
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        nominal: Number(t.nominal),
      })),
      totalTransaksi,
    });
  } catch (error) {
    console.error('API Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
