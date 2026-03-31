import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { Check, Crown, MessageCircle, Sparkles, Clock, X } from 'lucide-react';

const WA_NUMBER = '628211933818';
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const DEFAULTS = { harga_pro: 15000, harga_couple: 29000 };

const FEATURES = {
  GRATIS: [
    { label: 'Maksimal 50 transaksi per bulan', ok: true },
    { label: 'Catat via teks & voice note', ok: true },
    { label: 'Dashboard & ringkasan keuangan', ok: true },
    { label: 'Laporan bulanan dasar', ok: true },
    { label: 'Analisis kategori pengeluaran', ok: true },
    { label: 'Export laporan ke CSV', ok: false },
    { label: 'Reminder harian otomatis', ok: false },
  ],
  PRO: [
    { label: 'Transaksi tidak terbatas', ok: true },
    { label: 'Catat via teks & voice note', ok: true },
    { label: 'Dashboard & ringkasan keuangan', ok: true },
    { label: 'Laporan bulanan lengkap + grafik', ok: true },
    { label: 'Analisis kategori pengeluaran', ok: true },
    { label: 'Export laporan ke CSV', ok: true },
    { label: 'Reminder harian otomatis via WA', ok: true },
  ],
  COUPLE: [
    { label: 'Semua fitur Pro', ok: true },
    { label: '2 akun WA, 1 dashboard bersama', ok: true },
    { label: 'Laporan keuangan gabungan', ok: true },
    { label: 'Weekly digest pasangan', ok: true },
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
      {activeTier === 'GRATIS' ? (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent-dim p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">Kamu pakai plan Gratis</p>
              <p className="text-xs text-text-muted mt-0.5">Upgrade ke Pro untuk fitur lengkap tanpa batasan.</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-semibold bg-accent/20 text-accent px-2.5 py-1 rounded-full whitespace-nowrap">
            Plan Aktif
          </span>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-border-card bg-bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
              <Crown size={16} className="text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Plan aktif</p>
              <p className="text-sm font-semibold text-text-primary">{TIER_LABEL[activeTier]}</p>
            </div>
          </div>
          <div className="text-right">
            {isExpired ? (
              <>
                <p className="text-xs text-danger font-medium">Kedaluwarsa</p>
                <p className="text-[10px] text-text-muted mt-0.5">Perpanjang agar tetap aktif</p>
              </>
            ) : user.tierExpiry ? (
              <>
                <p className="text-xs text-text-muted">Aktif hingga</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{formatTanggal(user.tierExpiry.toISOString())}</p>
              </>
            ) : (
              <p className="text-xs font-medium text-success">Seumur hidup</p>
            )}
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">

        {/* Gratis */}
        <div className="bento-card flex flex-col">
          {/* Badge area — tinggi tetap agar harga sejajar */}
          <div className="h-6 mb-3 flex items-center">
            {activeTier === 'GRATIS' && (
              <span className="text-[10px] font-semibold bg-bg-card-hover text-text-muted px-2.5 py-1 rounded-full">
                Plan Aktif
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Gratis</p>
          <p className="text-3xl font-black text-text-primary">Rp0</p>
          <p className="text-text-muted text-xs mt-1 mb-5">Selamanya</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.GRATIS.map((f) => (
              <li key={f.label} className={`flex items-start gap-2 text-xs ${f.ok ? 'text-text-secondary' : 'text-text-muted opacity-40 line-through'}`}>
                {f.ok
                  ? <Check size={13} className="text-accent shrink-0 mt-0.5" />
                  : <X size={13} className="shrink-0 mt-0.5" />
                }
                {f.label}
              </li>
            ))}
          </ul>
          <div className="text-center text-xs text-text-muted py-2.5 border border-border-card rounded-xl">
            Plan saat ini
          </div>
        </div>

        {/* Pro */}
        <div className="bento-card flex flex-col relative border-accent/40" style={{ boxShadow: '0 0 32px -8px rgba(126,200,67,0.15)' }}>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-accent text-bg-primary px-3 py-1 rounded-full tracking-wide">
            Populer
          </span>
          {/* Badge area — tinggi tetap */}
          <div className="h-6 mb-3 flex items-center">
            {activeTier === 'PRO' && (
              <span className="text-[10px] font-semibold bg-accent-dim text-accent px-2.5 py-1 rounded-full">
                Plan Aktif
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Pro</p>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-black text-text-primary">{formatRupiah(hargaPro)}</p>
            <p className="text-text-muted text-xs mb-1">/bulan</p>
          </div>
          <p className="text-text-muted text-xs mt-1 mb-5">Akses penuh semua fitur</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.PRO.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-xs text-text-secondary">
                <Check size={13} className="text-accent shrink-0 mt-0.5" />
                {f.label}
              </li>
            ))}
          </ul>
          {activeTier === 'PRO' ? (
            <a
              href={waLink(`Halo, saya ingin perpanjang paket Pro Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-bg-primary px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
            >
              <MessageCircle size={13} /> Perpanjang via WhatsApp
            </a>
          ) : (
            <a
              href={waLink(`Halo, saya ingin upgrade ke paket Pro Izin Catat. Nama: ${user.nama ?? '-'}`)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-bg-primary px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
            >
              <MessageCircle size={13} /> Upgrade ke Pro via WhatsApp
            </a>
          )}
        </div>

        {/* Couple — coming soon */}
        <div className="bento-card flex flex-col relative opacity-60">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-semibold bg-bg-card border border-border-card text-text-muted px-3 py-1 rounded-full">
            <Clock size={10} /> Segera hadir
          </span>
          {/* Badge area — tinggi tetap */}
          <div className="h-6 mb-3" />
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Couple</p>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-black text-text-primary">{formatRupiah(hargaCouple)}</p>
            <p className="text-text-muted text-xs mb-1">/bulan</p>
          </div>
          <p className="text-text-muted text-xs mt-1 mb-5">2 akun, 1 data bersama</p>
          <ul className="space-y-2 flex-1 mb-6">
            {FEATURES.COUPLE.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-xs text-text-secondary">
                <Check size={13} className="text-accent shrink-0 mt-0.5" />
                {f.label}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-center gap-2 text-xs font-medium border border-border-card text-text-muted px-4 py-2.5 rounded-xl cursor-not-allowed">
            <Clock size={13} /> Dalam pengembangan
          </div>
        </div>

      </div>

      {/* Note */}
      <p className="text-center text-xs text-text-muted mt-6">
        Pembayaran dilakukan manual via WhatsApp. Tim kami akan mengaktifkan plan kamu dalam 1×24 jam.
      </p>
    </div>
  );
}
