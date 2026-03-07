import { NextRequest, NextResponse } from 'next/server';
import prisma, { resolveUserId } from '@/lib/prisma';

/**
 * GET /api/dashboard/recent?userId=...
 * 5 transaksi terakhir.
 * Queries: resolveUserId → 1×findMany
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req.nextUrl.searchParams.get('userId'));
    const userFilter = userId ? { userId } : {};

    const recentTransactions = await prisma.transaksi.findMany({
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
    });

    return NextResponse.json({
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        nominal: Number(t.nominal),
      })),
    });
  } catch (e) {
    console.error('dashboard/recent error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
