import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const publicId = searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const periode   = searchParams.get('periode') || 'bulan';
    const dateFrom  = searchParams.get('dateFrom');
    const dateTo    = searchParams.get('dateTo');
    const now       = new Date();

    const rawBulan  = parseInt(searchParams.get('bulan') ?? '');
    const rawTahun  = parseInt(searchParams.get('tahun') ?? '');
    const curBulan  = isNaN(rawBulan) ? now.getMonth() + 1 : rawBulan;
    const curTahun  = isNaN(rawTahun) ? now.getFullYear()  : rawTahun;

    let mulai: Date, akhir: Date, groupFormat: string;
    let prevMulai: Date, prevAkhir: Date;

    if (periode === 'minggu') {
      mulai     = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      akhir     = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      groupFormat = 'day';
      prevMulai = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
      prevAkhir = mulai;
    } else if (periode === 'tahun') {
      mulai     = new Date(curTahun, 0, 1);
      akhir     = new Date(curTahun + 1, 0, 1);
      groupFormat = 'month';
      prevMulai = new Date(curTahun - 1, 0, 1);
      prevAkhir = mulai;
    } else if (periode === 'kustom' && dateFrom && dateTo) {
      mulai     = new Date(dateFrom + 'T00:00:00');
      akhir     = new Date(dateTo   + 'T23:59:59');
      groupFormat = 'day';
      const dur = akhir.getTime() - mulai.getTime();
      prevMulai = new Date(mulai.getTime() - dur);
      prevAkhir = mulai;
    } else {
      // bulan
      mulai     = new Date(curTahun, curBulan - 1, 1);
      akhir     = new Date(curTahun, curBulan, 1);
      groupFormat = 'day';
      prevMulai = new Date(curTahun, curBulan - 2, 1);
      prevAkhir = mulai;
    }

    const [transaksi, prevTransaksi] = await Promise.all([
      prisma.transaksi.findMany({
        where: { user: { publicId }, tanggal: { gte: mulai, lt: akhir } },
        orderBy: { tanggal: 'asc' },
        select: { jenis: true, nominal: true, tanggal: true, kategori: true },
      }),
      prisma.transaksi.findMany({
        where: { user: { publicId }, tanggal: { gte: prevMulai, lt: prevAkhir } },
        select: { jenis: true, nominal: true },
      }),
    ]);

    // Group by date
    const grouped: Record<string, { masuk: number; keluar: number }> = {};
    const kategoriKeluar: Record<string, number> = {};
    const kategoriMasuk:  Record<string, number> = {};

    for (const t of transaksi) {
      const d   = new Date(t.tanggal);
      const key = groupFormat === 'month'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().slice(0, 10);

      if (!grouped[key]) grouped[key] = { masuk: 0, keluar: 0 };
      const nominal = Number(t.nominal);

      if (t.jenis === 'masuk') {
        grouped[key].masuk       += nominal;
        kategoriMasuk[t.kategori] = (kategoriMasuk[t.kategori] || 0) + nominal;
      } else {
        grouped[key].keluar        += nominal;
        kategoriKeluar[t.kategori]  = (kategoriKeluar[t.kategori] || 0) + nominal;
      }
    }

    const sortedKeys = Object.keys(grouped).sort();
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    const labels = sortedKeys.map((k) => {
      if (groupFormat === 'month') {
        const [y, m] = k.split('-');
        return `${MONTHS_SHORT[parseInt(m) - 1]} ${y.slice(2)}`;
      }
      const d = new Date(k);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const masuk  = sortedKeys.map((k) => grouped[k].masuk);
    const keluar = sortedKeys.map((k) => grouped[k].keluar);

    const totalMasuk  = masuk.reduce((a, b)  => a + b, 0);
    const totalKeluar = keluar.reduce((a, b) => a + b, 0);

    let prevTotalMasuk = 0, prevTotalKeluar = 0;
    for (const t of prevTransaksi) {
      const n = Number(t.nominal);
      if (t.jenis === 'masuk') prevTotalMasuk += n;
      else prevTotalKeluar += n;
    }

    const toArr = (map: Record<string, number>) =>
      Object.entries(map).sort(([, a], [, b]) => b - a).map(([nama, total]) => ({ nama, total }));

    return NextResponse.json(
      {
        labels, masuk, keluar,
        kategoriKeluar: toArr(kategoriKeluar),
        kategoriMasuk:  toArr(kategoriMasuk),
        totalMasuk, totalKeluar,
        saldo: totalMasuk - totalKeluar,
        prevTotalMasuk, prevTotalKeluar,
      },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('API Laporan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
