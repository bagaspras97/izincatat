import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

/**
 * GET /api/admin/pengeluaran
 * Ambil semua pengeluaran dev + total.
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.devExpense.findMany({ orderBy: { tanggal: 'desc' } });

  const total = items.reduce((sum, item) => sum + Number(item.harga), 0);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      nama: item.nama,
      harga: Number(item.harga),
      tanggal: item.tanggal.toISOString(),
      createdAt: item.createdAt.toISOString(),
    })),
    total,
  });
}

/**
 * POST /api/admin/pengeluaran
 * Tambah pengeluaran baru.
 * Body: { nama: string, harga: number, tanggal: string }
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { nama, harga, tanggal } = body;

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return NextResponse.json({ error: 'Nama tidak valid' }, { status: 400 });
  }
  if (typeof harga !== 'number' || harga < 0) {
    return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 });
  }

  const created = await prisma.devExpense.create({
    data: {
      nama: nama.trim(),
      harga,
      tanggal: tanggal ? new Date(tanggal) : new Date(),
    },
  });

  return NextResponse.json({
    id: created.id,
    nama: created.nama,
    harga: Number(created.harga),
    tanggal: created.tanggal.toISOString(),
    createdAt: created.createdAt.toISOString(),
  }, { status: 201 });
}
