import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { Check, Crown, MessageCircle, Sparkles } from 'lucide-react';

const WA_NUMBER = '628211933818';
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const DEFAULTS = { harga_pro: 15000, harga_couple: 29000 };

const FEATURES = {
  GRATIS: [
    '50 transaksi per bulan',
    'Catat via teks & voice note',
    'Dashboard & laporan dasar',
    'Analisis kategori',
  ],
  PRO: [
    '500 transaksi per bulan',
    'Dashboard & laporan lengkap',
    'Reminder harian otomatis',
    'Export CSV',
    'Riwayat tidak terbatas',
  ],
  COUPLE: [
    'Semua fitur Pro',
    'Transaksi tidak terbatas',
    '2 akun WA, 1 dashboard bersama',
    'Digest & recap mingguan',
    'Laporan gabungan pasangan',
  ],
};

const TIER_LABEL: Record<string, string> = {
  GRATIS: 'Gratis',
  PRO: 'Pro',
  COUPLE: 'Couple',
};

export default async function UpgradePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const [user, settingRows] = await Promise.all([
    prisma.user.findUnique({
      where: { publicId: userId },
      select: { nama: true, tier: true, tierExpiry: true },
    }),
    prisma.setting.findMany({ where: { key: { in: ['harga_pro', 'harga_couple'] } } }),
  ]);

  if (!user) notFound();

  const map = Object.fromEntries(settingRows.map((r) => [r.key, parseInt(r.value, 10)]));
  const hargaPro = map.harga_pro ?? DEFAULTS.harga_pro;
  const hargaCouple = map.harga_couple ?? DEFAULTS.harga_couple;

  const tier = (user.tier ?? 'GRATIS') as 'GRATIS' | 'PRO' | 'COUPLE';
  const isExpired = user.tierExpiry ? user.tierExpiry < new Date() : false;
  const activeTier = isExpired ? 'GRATIS' : tier;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Upgrade Plan</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Pilih plan yang sesuai kebutuhanmu</p>
      </div>

      {/* Current plan banner */}
      <div className="bento-card mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
            <Crown size={16} className="text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Plan kamu saat ini</p>
            <p className="text-sm font-semibold text-text-primary">
              {TIER_LABEL[activeTier]}
              {activeTier !== 'GRATIS' && user.tierExpiry && !isExpired && (
                <span className="text-xs font-normal text-text-muted ml-2">
                  · Aktif hingga {formatTanggal(user.tierExpiry.toISOString())}
                </span>
              )}
              {isExpired && tier !== 'GRATIS' && (
                <span className="text-xs font-normal text-danger ml-2">· Kedaluwarsa</span>
              )}
            </p>
          </div>
        </div>
        {activeTier === 'GRATIS' && (
          <div className="flex items-center gap-1.5 text-xs text-accent font-medium">
            <Sparkles size={13} />
            Upgrade untuk fitur lebih
          </div>
        )}
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Gratis */}
        <div className={`bento-card flex flex-col ${activeTier === 'GRATIS' ? 'border-border-card' : ''}`}>
          {activeTier === 'GRATIS' && (
            <span className="self-start text-[10px] font-semibold bg-bg-card-hover text-text-muted px-2.5 py-1 rounded-full mb-3">
              Plan Aktif
            </span>
          )}
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Gratis</p>
          <p className="text-3xl font-black text-text-primary mb-1">Rp0</p>
          <p className="text-text-muted text-xs mb-5">Selamanya</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.GRATIS.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                <Check size={13} className="text-accent shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="text-center text-xs text-text-muted py-2.5 border border-border-card rounded-xl">
            Plan saat ini
          </div>
        </div>

        {/* Pro */}
        <div className={`bento-card flex flex-col relative ${activeTier === 'PRO' ? 'border-accent' : 'border-accent/40'}`}
          style={{ boxShadow: '0 0 32px -8px rgba(126,200,67,0.15)' }}>
          {/* Populer badge */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-accent text-bg-primary px-3 py-1 rounded-full tracking-wide">
            Populer
          </span>
          {activeTier === 'PRO' && (
            <span className="self-start text-[10px] font-semibold bg-accent-dim text-accent px-2.5 py-1 rounded-full mb-3">
              Plan Aktif
            </span>
          )}
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3">Pro</p>
          <div className="flex items-end gap-1 mb-1">
            <p className="text-3xl font-black text-text-primary">{formatRupiah(hargaPro)}</p>
            <p className="text-text-muted text-xs mb-1">/bulan</p>
          </div>
          <p className="text-text-muted text-xs mb-5">Untuk pemakaian harian</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.PRO.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                <Check size={13} className="text-accent shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {activeTier === 'PRO' ? (
            <a
              href={waLink(`Halo, saya ingin perpanjang paket Pro Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-bg-primary px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
            >
              <MessageCircle size={13} />
              Perpanjang via WhatsApp
            </a>
          ) : (
            <a
              href={waLink(`Halo, saya ingin upgrade ke paket Pro Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-bg-primary px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
            >
              <MessageCircle size={13} />
              Upgrade ke Pro via WhatsApp
            </a>
          )}
        </div>

        {/* Couple */}
        <div className={`bento-card flex flex-col ${activeTier === 'COUPLE' ? 'border-accent' : ''}`}>
          {activeTier === 'COUPLE' && (
            <span className="self-start text-[10px] font-semibold bg-accent-dim text-accent px-2.5 py-1 rounded-full mb-3">
              Plan Aktif
            </span>
          )}
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Couple</p>
          <div className="flex items-end gap-1 mb-1">
            <p className="text-3xl font-black text-text-primary">{formatRupiah(hargaCouple)}</p>
            <p className="text-text-muted text-xs mb-1">/bulan</p>
          </div>
          <p className="text-text-muted text-xs mb-5">2 akun, 1 data bersama</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.COUPLE.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                <Check size={13} className="text-accent shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {activeTier === 'COUPLE' ? (
            <a
              href={waLink(`Halo, saya ingin perpanjang paket Couple Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold border border-border-card text-text-primary px-4 py-2.5 rounded-xl hover:bg-bg-card-hover transition-all"
            >
              <MessageCircle size={13} />
              Perpanjang via WhatsApp
            </a>
          ) : (
            <a
              href={waLink(`Halo, saya ingin upgrade ke paket Couple Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold border border-border-card text-text-primary px-4 py-2.5 rounded-xl hover:bg-bg-card-hover transition-all"
            >
              <MessageCircle size={13} />
              Upgrade ke Couple via WhatsApp
            </a>
          )}
        </div>

      </div>

      {/* Note */}
      <p className="text-center text-xs text-text-muted mt-6">
        Pembayaran dilakukan manual via WhatsApp. Tim kami akan mengaktifkan plan kamu dalam 1×24 jam.
      </p>
    </div>
  );
}
