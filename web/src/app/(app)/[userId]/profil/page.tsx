import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Phone, Calendar, Crown, User, Hash, ShieldCheck, Sparkles } from 'lucide-react';
import { formatTanggal } from '@/lib/format';

const TIER_CONFIG = {
  GRATIS: { label: 'Gratis', color: 'text-text-secondary bg-bg-card-hover' },
  PRO: { label: 'Pro', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30' },
  COUPLE: { label: 'Couple', color: 'text-pink-600 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/30' },
};

const TIER_FEATURES = [
  { label: 'Catat & lihat transaksi', tiers: ['GRATIS', 'PRO', 'COUPLE'] },
  { label: 'Laporan bulanan', tiers: ['GRATIS', 'PRO', 'COUPLE'] },
  { label: 'Analisis kategori', tiers: ['GRATIS', 'PRO', 'COUPLE'] },
  { label: 'Riwayat tidak terbatas', tiers: ['PRO', 'COUPLE'] },
  { label: 'Mode couple (2 nomor)', tiers: ['COUPLE'] },
];

export default async function ProfilPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { publicId: userId },
    select: {
      nomorWa: true,
      nama: true,
      tier: true,
      tierExpiry: true,
      createdAt: true,
      _count: { select: { transaksi: true } },
    },
  });

  if (!user) notFound();

  const tier = (user.tier ?? 'GRATIS') as keyof typeof TIER_CONFIG;
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.GRATIS;
  const now = new Date();
  const isExpired = user.tierExpiry ? user.tierExpiry < now : false;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Profil</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">Informasi akun kamu</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* ─── Akun ─── */}
        <div className="bento-card">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Akun</h2>
          <div className="flex flex-col gap-4">

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                <User size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Nama</p>
                <p className="text-sm font-medium text-text-primary">{user.nama ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                <Phone size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Nomor WhatsApp</p>
                <p className="text-sm font-medium text-text-primary font-mono">{user.nomorWa}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Bergabung</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatTanggal(user.createdAt.toISOString())}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center shrink-0">
                <Hash size={16} className="text-info" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Transaksi</p>
                <p className="text-sm font-medium text-text-primary">{user._count.transaksi}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Langganan ─── */}
        <div className="bento-card">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Langganan</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                <Crown size={16} className="text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Tier</p>
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5 ${tierCfg.color}`}>
                  {tierCfg.label}
                </span>
              </div>
            </div>

            {tier !== 'GRATIS' && (
              <div className="text-right">
                <p className="text-xs text-text-muted">Masa aktif hingga</p>
                {user.tierExpiry ? (
                  <p className={`text-sm font-medium mt-0.5 ${isExpired ? 'text-danger' : 'text-text-primary'}`}>
                    {isExpired ? 'Kedaluwarsa' : formatTanggal(user.tierExpiry.toISOString())}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-success mt-0.5">Seumur hidup</p>
                )}
              </div>
            )}
            {(tier === 'GRATIS' || isExpired) && (
              <Link
                href={`/${userId}/upgrade`}
                className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-bg-primary px-3 py-1.5 rounded-xl hover:brightness-110 transition-all shrink-0"
              >
                <Sparkles size={12} />
                Upgrade
              </Link>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border-card">
            <p className="text-xs text-text-muted mb-2.5">Fitur aktif</p>
            <div className="flex flex-col gap-2">
              {TIER_FEATURES.map(({ label, tiers }) => {
                const active = tiers.includes(tier);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <ShieldCheck
                      size={13}
                      className={active ? 'text-success' : 'text-text-muted opacity-30'}
                    />
                    <span className={`text-xs ${active ? 'text-text-secondary' : 'text-text-muted opacity-40'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
