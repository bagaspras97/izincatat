import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/laporan?userId=clxyz...&periode=bulan
 * Laporan pemasukan vs pengeluaran per hari dalam periode.
 *
 * Optimasi: eliminasi resolveUserId round-trip — filter langsung via user.publicId (JOIN).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const publicId = searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const periode = searchParams.get('periode') || 'bulan'; // minggu | bulan | tahun

    const now = new Date();
    let mulai: Date;
    let groupFormat: string;

    if (periode === 'minggu') {
      mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      groupFormat = 'day';
    } else if (periode === 'tahun') {
      mulai = new Date(now.getFullYear(), 0, 1);
      groupFormat = 'month';
    } else {
      // bulan
      mulai = new Date(now.getFullYear(), now.getMonth(), 1);
      groupFormat = 'day';
    }

    const transaksi = await prisma.transaksi.findMany({
      where: { user: { publicId }, tanggal: { gte: mulai } },
      orderBy: { tanggal: 'asc' },
      select: { jenis: true, nominal: true, tanggal: true, kategori: true },
    });

    // Group by date
    const grouped: Record<string, { masuk: number; keluar: number }> = {};
    const kategoriMap: Record<string, number> = {};

    for (const t of transaksi) {
      const d = new Date(t.tanggal);
      let key: string;

      if (groupFormat === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupFormat === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 10);
      }

      if (!grouped[key]) grouped[key] = { masuk: 0, keluar: 0 };

      const nominal = Number(t.nominal);
      if (t.jenis === 'masuk') {
        grouped[key].masuk += nominal;
      } else {
        grouped[key].keluar += nominal;
      }

      // Kategori (hanya pengeluaran)
      if (t.jenis === 'keluar') {
        kategoriMap[t.kategori] = (kategoriMap[t.kategori] || 0) + nominal;
      }
    }

    // Convert to sorted arrays
    const sortedKeys = Object.keys(grouped).sort();
    const labels = sortedKeys.map((k) => {
      if (groupFormat === 'month') {
        const [y, m] = k.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
      }
      const d = new Date(k);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const masuk = sortedKeys.map((k) => grouped[k].masuk);
    const keluar = sortedKeys.map((k) => grouped[k].keluar);

    // Top kategori
    const kategori = Object.entries(kategoriMap)
      .sort(([, a], [, b]) => b - a)
      .map(([nama, total]) => ({ nama, total }));

    // Totals
    const totalMasuk = masuk.reduce((a, b) => a + b, 0);
    const totalKeluar = keluar.reduce((a, b) => a + b, 0);

    return NextResponse.json(
      {
        labels,
        masuk,
        keluar,
        kategori,
        totalMasuk,
        totalKeluar,
        saldo: totalMasuk - totalKeluar,
      },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('API Laporan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
