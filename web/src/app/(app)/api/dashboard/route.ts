import { NextRequest, NextResponse } from 'next/server';
import prisma, { resolveUserId } from '@/lib/prisma';

/**
 * GET /api/dashboard?userId=clxyz...
 * Ambil data ringkasan untuk halaman dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = await resolveUserId(searchParams.get('userId'));

    const userFilter = userId ? { userId } : {};

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Saldo hari ini
    const [todayMasuk, todayKeluar] = await Promise.all([
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'masuk', tanggal: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'keluar', tanggal: { gte: todayStart, lt: todayEnd } },
      }),
    ]);

    // Saldo bulan ini
    const [monthMasuk, monthKeluar] = await Promise.all([
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'masuk', tanggal: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'keluar', tanggal: { gte: monthStart, lt: monthEnd } },
      }),
    ]);

    // Saldo total sepanjang masa
    const [totalMasuk, totalKeluar] = await Promise.all([
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'masuk' },
      }),
      prisma.transaksi.aggregate({
        _sum: { nominal: true },
        where: { ...userFilter, jenis: 'keluar' },
      }),
    ]);

    // Data 7 hari terakhir untuk sparkline
    const last7days: { tanggal: Date; masuk: number; keluar: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

      const [m, k] = await Promise.all([
        prisma.transaksi.aggregate({
          _sum: { nominal: true },
          where: { ...userFilter, jenis: 'masuk', tanggal: { gte: dayStart, lt: dayEnd } },
        }),
        prisma.transaksi.aggregate({
          _sum: { nominal: true },
          where: { ...userFilter, jenis: 'keluar', tanggal: { gte: dayStart, lt: dayEnd } },
        }),
      ]);

      last7days.push({
        tanggal: dayStart,
        masuk: Number(m._sum.nominal) || 0,
        keluar: Number(k._sum.nominal) || 0,
      });
    }

    // 5 transaksi terakhir
    const recentTransactions = await prisma.transaksi.findMany({
      where: userFilter,
      orderBy: { tanggal: 'desc' },
      take: 5,
      include: { user: { select: { nama: true } } },
    });

    // Total count transaksi
    const totalTransaksi = await prisma.transaksi.count({ where: userFilter });

    return NextResponse.json({
      today: {
        masuk: Number(todayMasuk._sum.nominal) || 0,
        keluar: Number(todayKeluar._sum.nominal) || 0,
      },
      month: {
        masuk: Number(monthMasuk._sum.nominal) || 0,
        keluar: Number(monthKeluar._sum.nominal) || 0,
      },
      total: {
        masuk: Number(totalMasuk._sum.nominal) || 0,
        keluar: Number(totalKeluar._sum.nominal) || 0,
      },
      last7days,
      recentTransactions: recentTransactions.map((t: typeof recentTransactions[number]) => ({
        id: t.id,
        jenis: t.jenis,
        nominal: Number(t.nominal),
        keterangan: t.keterangan,
        kategori: t.kategori,
        tanggal: t.tanggal,
      })),
      totalTransaksi,
    });
  } catch (error) {
    console.error('API Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
