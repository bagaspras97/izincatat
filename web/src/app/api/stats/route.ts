import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats
 * Statistik publik untuk landing page social proof.
 * Tidak memerlukan auth.
 */
export async function GET() {
  const [userCount, txCount] = await Promise.all([
    prisma.user.count(),
    prisma.transaksi.count(),
  ]);

  return NextResponse.json({
    users: userCount,
    transactions: txCount,
  });
}
