import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = { harga_pro: 15000, harga_couple: 29000 };

/**
 * GET /api/settings
 * Ambil harga tier — publik, tidak perlu auth.
 */
export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['harga_pro', 'harga_couple'] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, parseInt(r.value, 10)]));
  return NextResponse.json({
    harga_pro: map.harga_pro ?? DEFAULTS.harga_pro,
    harga_couple: map.harga_couple ?? DEFAULTS.harga_couple,
  });
}
