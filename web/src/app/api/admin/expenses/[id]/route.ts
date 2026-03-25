import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

/**
 * PATCH /api/admin/pengeluaran/[id]
 * Update pengeluaran.
 * Body: { nama?: string, harga?: number, tanggal?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const expenseId = parseInt(id, 10);
  if (isNaN(expenseId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  const body = await req.json();
  const { nama, harga, tanggal } = body;

  const data: Record<string, unknown> = {};
  if (typeof nama === 'string' && nama.trim()) data.nama = nama.trim();
  if (typeof harga === 'number' && harga >= 0) data.harga = harga;
  if (typeof tanggal === 'string') data.tanggal = new Date(tanggal);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang diperbarui' }, { status: 400 });
  }

  const updated = await prisma.devExpense.update({
    where: { id: expenseId },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    nama: updated.nama,
    harga: Number(updated.harga),
    tanggal: updated.tanggal.toISOString(),
    createdAt: updated.createdAt.toISOString(),
  });
}

/**
 * DELETE /api/admin/pengeluaran/[id]
 * Hapus pengeluaran.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const expenseId = parseInt(id, 10);
  if (isNaN(expenseId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  await prisma.devExpense.delete({ where: { id: expenseId } });

  return NextResponse.json({ ok: true });
}
