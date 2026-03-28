import { prisma } from '@/lib/prisma';
import { LandingClient } from '@/components/landing/LandingClient';

const DEFAULTS = { harga_pro: 15000, harga_couple: 29000 };

export default async function Page() {
  let userCount = 0;
  let txCount = 0;
  let hargaPro = DEFAULTS.harga_pro;
  let hargaCouple = DEFAULTS.harga_couple;

  try {
    const [userCountResult, txCountResult, settingRows] = await Promise.all([
      prisma.user.count(),
      prisma.transaksi.count(),
      prisma.setting.findMany({ where: { key: { in: ['harga_pro', 'harga_couple'] } } }),
    ]);
    userCount = userCountResult;
    txCount = txCountResult;
    const map = Object.fromEntries(settingRows.map((r) => [r.key, parseInt(r.value, 10)]));
    hargaPro = map.harga_pro ?? DEFAULTS.harga_pro;
    hargaCouple = map.harga_couple ?? DEFAULTS.harga_couple;
  } catch {
    // fallback ke default jika DB tidak tersedia
  }

  return (
    <LandingClient
      initialStats={{ users: userCount, transactions: txCount }}
      initialSettings={{ harga_pro: hargaPro, harga_couple: hargaCouple }}
    />
  );
}
