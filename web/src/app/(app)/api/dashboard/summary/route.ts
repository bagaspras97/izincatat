import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AggRow = { jenis: string; _sum: { nominal: unknown } };
const sumOf = (rows: AggRow[], jenis: string) =>
  Number(rows.find((r) => r.jenis === jenis)?._sum.nominal ?? 0);

/**
 * GET /api/dashboard/summary?userId=...
 * Stats cards: saldo total, bulan ini, hari ini + totalTransaksi.
 *
 * Optimasi: eliminasi resolveUserId round-trip — filter langsung via user.publicId (JOIN).
 * Satu round-trip DB: 3×groupBy + 1×count semua paralel.
 */
export async function GET(req: NextRequest) {
  try {
    const publicId = req.nextUrl.searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [todayAgg, monthAgg, totalAgg, totalTransaksi] = await Promise.all([
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
    ]);

    return NextResponse.json(
      {
        today: { masuk: sumOf(todayAgg, 'masuk'), keluar: sumOf(todayAgg, 'keluar') },
        month: { masuk: sumOf(monthAgg, 'masuk'), keluar: sumOf(monthAgg, 'keluar') },
        total: { masuk: sumOf(totalAgg, 'masuk'), keluar: sumOf(totalAgg, 'keluar') },
        totalTransaksi,
      },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } },
    );
  } catch (e) {
    console.error('dashboard/summary error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
