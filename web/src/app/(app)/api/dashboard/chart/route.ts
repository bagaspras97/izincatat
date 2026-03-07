import { NextRequest, NextResponse } from 'next/server';
import prisma, { resolveUserId } from '@/lib/prisma';

/**
 * GET /api/dashboard/chart?userId=...
 * Data 7 hari terakhir untuk bar chart & sparklines.
 * Queries: resolveUserId → 1×findMany → aggregasi JS
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req.nextUrl.searchParams.get('userId'));
    const userFilter = userId ? { userId } : {};

    const now = new Date();
    const day0Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const todayEnd  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const rows = await prisma.transaksi.findMany({
      where: { ...userFilter, tanggal: { gte: day0Start, lt: todayEnd } },
      select: { tanggal: true, jenis: true, nominal: true },
    });

    const last7days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const dayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i) + 1);
      const day      = rows.filter((t) => t.tanggal >= dayStart && t.tanggal < dayEnd);
      return {
        tanggal: dayStart,
        masuk:  day.filter((t) => t.jenis === 'masuk').reduce((s, t) => s + Number(t.nominal), 0),
        keluar: day.filter((t) => t.jenis === 'keluar').reduce((s, t) => s + Number(t.nominal), 0),
      };
    });

    return NextResponse.json({ last7days });
  } catch (e) {
    console.error('dashboard/chart error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
