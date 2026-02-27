import { NextRequest, NextResponse } from 'next/server';
import prisma, { resolveUserId } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/transaksi?userId=clxyz...&page=1&limit=20&jenis=keluar&search=makan
 *
 * Catatan: field `keterangan` dienkripsi di DB (AES-256-GCM).
 * Pencarian by keterangan dilakukan in-memory setelah dekripsi.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const jenis = searchParams.get('jenis'); // masuk | keluar | null
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const sort = searchParams.get('sort') || 'terbaru'; // terbaru | terlama | terbesar | terkecil
    const userId = await resolveUserId(searchParams.get('userId'));

    // Filter jenis dan user bisa di DB (tidak sensitif)
    const where = {
      ...(userId ? { userId } : {}),
      ...(jenis === 'masuk' || jenis === 'keluar' ? { jenis } : {}),
    };

    // Build orderBy
    const orderByMap = {
      terbaru: { tanggal: 'desc' as const },
      terlama: { tanggal: 'asc' as const },
      terbesar: { nominal: 'desc' as const },
      terkecil: { nominal: 'asc' as const },
    };
    const orderBy = orderByMap[sort as keyof typeof orderByMap] ?? orderByMap.terbaru;

    // Jika ada search, fetch semua dulu lalu filter in-memory setelah dekripsi
    if (search) {
      const allTransaksi = await prisma.transaksi.findMany({
        where,
        orderBy,
        include: { user: { select: { nama: true } } },
      });

      const decrypted = allTransaksi.map((t) => ({
        id: t.id,
        jenis: t.jenis,
        nominal: Number(t.nominal),
        keterangan: decrypt(t.keterangan),
        kategori: t.kategori,
        tanggal: t.tanggal,
        user: t.user?.nama,
      }));

      const filtered = decrypted.filter((t) =>
        t.keterangan.toLowerCase().includes(search)
      );

      const total = filtered.length;
      const data = filtered.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Tanpa search — gunakan DB-level pagination (efisien)
    const [transaksi, total] = await Promise.all([
      prisma.transaksi.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { nama: true } } },
      }),
      prisma.transaksi.count({ where }),
    ]);

    return NextResponse.json({
      data: transaksi.map((t) => ({
        id: t.id,
        jenis: t.jenis,
        nominal: Number(t.nominal),
        keterangan: decrypt(t.keterangan),
        kategori: t.kategori,
        tanggal: t.tanggal,
        user: t.user?.nama,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('API Transaksi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
