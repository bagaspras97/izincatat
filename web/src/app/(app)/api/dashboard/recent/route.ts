import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/recent?userId=...
 * 5 transaksi terakhir.
 *
 * Optimasi: eliminasi resolveUserId round-trip — filter langsung via user.publicId (JOIN).
 * Satu round-trip DB: 1×findMany.
 */
export async function GET(req: NextRequest) {
  try {
    const publicId = req.nextUrl.searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const recentTransactions = await prisma.transaksi.findMany({
      where: { user: { publicId } },
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
    });

    return NextResponse.json(
      {
        recentTransactions: recentTransactions.map((t) => ({
          ...t,
          nominal: Number(t.nominal),
        })),
      },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } },
    );
  } catch (e) {
    console.error('dashboard/recent error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
