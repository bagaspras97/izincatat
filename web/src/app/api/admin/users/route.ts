import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('x-admin-secret');
  return auth === secret;
}

/**
 * GET /api/admin/users
 * Ambil semua user beserta jumlah transaksi bulan ini.
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const bulanMulai = new Date(now.getFullYear(), now.getMonth(), 1);
  const bulanSelesai = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      publicId: true,
      nomorWa: true,
      nama: true,
      tier: true,
      tierExpiry: true,
      isActive: true,
      createdAt: true,
      _count: { select: { transaksi: true } },
    },
  });

  // Hitung transaksi bulan ini per user
  const txBulanIni = await prisma.transaksi.groupBy({
    by: ['userId'],
    where: { tanggal: { gte: bulanMulai, lt: bulanSelesai } },
    _count: { id: true },
  });

  const txMap = Object.fromEntries(txBulanIni.map((t) => [t.userId, t._count.id]));

  const data = users.map((u) => ({
    ...u,
    nomorWa: u.nomorWa.replace('@s.whatsapp.net', ''),
    txTotal: u._count.transaksi,
    txBulanIni: txMap[u.id] ?? 0,
  }));

  return NextResponse.json(data);
}

/**
 * PATCH /api/admin/users
 * Update tier dan tierExpiry satu user.
 * Body: { userId: number, tier: string, tierExpiry: string | null }
 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, tier, tierExpiry } = await req.json();

  if (!userId || !['GRATIS', 'PRO', 'COUPLE'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      tier,
      tierExpiry: tierExpiry ? new Date(tierExpiry) : null,
    },
    select: { id: true, tier: true, tierExpiry: true },
  });

  return NextResponse.json(updated);
}
