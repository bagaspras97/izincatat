import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/kategori?userId=clxyz...
 * Breakdown pengeluaran per kategori (bulan ini).
 *
 * Optimasi: eliminasi resolveUserId round-trip — filter langsung via user.publicId (JOIN).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const publicId = searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const grouped = await prisma.transaksi.groupBy({
      by: ['kategori'],
      where: {
        user: { publicId },
        jenis: 'keluar',
        tanggal: { gte: monthStart, lt: monthEnd },
      },
      _sum: { nominal: true },
      _count: { id: true },
      orderBy: { _sum: { nominal: 'desc' } },
    });

    const total = grouped.reduce((acc: number, g: typeof grouped[number]) => acc + (Number(g._sum.nominal) || 0), 0);

    const data = grouped.map((g: typeof grouped[number]) => ({
      kategori: g.kategori,
      total: Number(g._sum.nominal) || 0,
      count: g._count.id,
      persen: total > 0 ? Math.round(((Number(g._sum.nominal) || 0) / total) * 100) : 0,
    }));

    return NextResponse.json(
      { data, grandTotal: total },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('API Kategori error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
