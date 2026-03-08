import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

const DEFAULTS = { harga_pro: 15000, harga_couple: 29000 };

/**
 * GET /api/admin/settings
 * Ambil harga tier saat ini.
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.setting.findMany({
    where: { key: { in: ['harga_pro', 'harga_couple'] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, parseInt(r.value, 10)]));
  return NextResponse.json({
    harga_pro: map.harga_pro ?? DEFAULTS.harga_pro,
    harga_couple: map.harga_couple ?? DEFAULTS.harga_couple,
  });
}

/**
 * PATCH /api/admin/settings
 * Update harga tier.
 * Body: { harga_pro?: number, harga_couple?: number }
 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { harga_pro, harga_couple } = body;

  const updates: Promise<unknown>[] = [];

  if (typeof harga_pro === 'number' && harga_pro >= 0) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'harga_pro' },
        update: { value: String(harga_pro) },
        create: { key: 'harga_pro', value: String(harga_pro) },
      }),
    );
  }

  if (typeof harga_couple === 'number' && harga_couple >= 0) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'harga_couple' },
        update: { value: String(harga_couple) },
        create: { key: 'harga_couple', value: String(harga_couple) },
      }),
    );
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
