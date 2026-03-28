'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { FloatingElements } from '@/components/landing/FloatingElements';
import { TypingText } from '@/components/landing/TypingText';
import { AnimatedChat } from '@/components/landing/AnimatedChat';
import { GlowCard } from '@/components/landing/GlowCard';
import {
  MessageSquare,
  Mic,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Zap,
  Users,
  ArrowLeftRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Check,
} from 'lucide-react';

/* ─── DATA ─── */

const WA_NUMBER = '628211933818';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Halo`;
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const features = [
  {
    icon: MessageSquare,
    title: 'Tanpa Aplikasi Tambahan',
    desc: 'WhatsApp sudah ada di HP kamu. Kenapa harus install aplikasi lain? Langsung catat dari sana.',
  },
  {
    icon: Mic,
    title: 'Cukup Bicara, Bot yang Kerja',
    desc: 'Kirim voice note "habis 40rb buat bensin" — bot langsung paham, catat, dan kategorikan.',
  },
  {
    icon: Zap,
    title: 'Ngingetin Sebelum Kamu Lupa',
    desc: 'Belum catat hari ini? Bot yang duluan kirim pesan. Tiap Senin juga ada recap mingguan biar kamu tahu uang kamu pergi ke mana.',
  },
  {
    icon: BarChart3,
    title: 'Laporan Tanpa Buka Laptop',
    desc: 'Tanya "laporan bulan ini" di chat — langsung dapat ringkasan uang masuk, keluar, dan sisa saldo.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Buat yang Suka Visual',
    desc: 'Grafik, breakdown kategori, tren 7 hari — semua tersaji rapi di dashboard web.',
  },
  {
    icon: ShieldCheck,
    title: 'Data Kamu, Privasi Kamu',
    desc: 'Semua catatan keuangan dienkripsi end-to-end. Hanya kamu yang bisa akses datamu.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Simpan Nomornya',
    desc: 'Tambahkan nomor Izin Catat ke kontak WhatsApp. Satu kali saja, selesai.',
  },
  {
    num: '02',
    title: 'Kirim "Halo"',
    desc: 'Bot langsung menyapa, daftarkan akunmu, dan siap dipakai — tanpa isi formulir apapun.',
  },
  {
    num: '03',
    title: 'Catat Sesuka Hati',
    desc: 'Tulis natural kayak chat biasa. Atau kirim voice note kalau lagi sibuk.',
  },
];

const exampleMessages = [
  { text: 'catat keluar nasi goreng 25rb', desc: 'Catat pengeluaran' },
  { text: 'catat masuk gaji 5jt', desc: 'Catat pemasukan' },
  { text: 'saldo', desc: 'Cek sisa saldo kamu' },
  { text: 'laporan', desc: 'Ringkasan keuangan bulan ini' },
  { text: 'riwayat', desc: 'Lihat 10 transaksi terakhir' },
  { text: 'hapus 1', desc: 'Hapus transaksi yang salah' },
];

function formatHarga(n: number): string {
  if (n === 0) return 'Gratis';
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return n.toLocaleString('id-ID');
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return `${n}+`;
}

/* ─── COMPONENT ─── */

const STATS_THRESHOLD = 50;

export function LandingClient({
  initialStats,
  initialSettings,
}: {
  initialStats: { users: number; transactions: number };
  initialSettings: { harga_pro: number; harga_couple: number };
}) {
  const [stats] = useState(initialStats);
  const hargaPro = initialSettings.harga_pro;
  const hargaCouple = initialSettings.harga_couple;

  const showStats = stats.users >= STATS_THRESHOLD;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-card/50 bg-bg-primary/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Logo size={28} />
            <span className="text-sm sm:text-base tracking-tight">
              <span className="font-light text-text-secondary">Izin</span><span className="font-black text-text-primary">Catat</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-medium bg-accent text-bg-primary px-4 sm:px-5 py-1.5 sm:py-2 rounded-full hover:brightness-110 transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32">
        {/* Background glows */}
        <div className="hero-glow w-125 h-125 bg-accent/30 -top-40 -left-40" />
        <div className="hero-glow w-100 h-100 bg-accent/20 bottom-20 right-0" style={{ animationDelay: '3s' }} />
        <div className="hero-glow w-75 h-75 bg-accent/15 top-1/3 right-1/4" style={{ animationDelay: '5s' }} />

        {/* Floating icons */}
        <FloatingElements />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">

          <AnimatedSection delay={0.1}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6 sm:mb-8">
              Catat keuangan,
              <br />
              <TypingText phrase="langsung di WhatsApp." className="text-accent" />
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
              Catat pemasukan &amp; pengeluaran, pantau saldo, hingga lihat laporan
              keuangan — semua cukup dari WhatsApp.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 bg-accent text-bg-primary font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base hover:brightness-110 transition-all hover:shadow-xl hover:shadow-accent/25 w-full sm:w-auto justify-center"
              >
                Coba Gratis Sekarang
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#fitur"
                className="inline-flex items-center gap-2 text-text-secondary font-medium px-6 py-3.5 rounded-full text-sm sm:text-base hover:text-text-primary transition-colors border border-border-card hover:border-text-muted"
              >
                Lihat Fitur
              </a>
            </div>
          </AnimatedSection>

          {/* Scroll indicator */}
          <AnimatedSection delay={0.6}>
            <div className="mt-16 sm:mt-24 flex flex-col items-center gap-2 text-text-muted">
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <div className="w-5 h-8 rounded-full border-2 border-text-muted/40 flex items-start justify-center p-1">
                <div className="w-1 h-2 rounded-full bg-accent animate-bounce" />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── SECTION DIVIDER ─── */}
      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── SOCIAL PROOF ─── */}
      {showStats && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-dim mb-3">
                    <Users size={18} className="text-accent" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-text-primary">{formatStat(stats.users)}</p>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Pengguna aktif</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-dim mb-3">
                    <ArrowLeftRight size={18} className="text-accent" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-text-primary">{formatStat(stats.transactions)}</p>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Transaksi tercatat</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-dim mb-3">
                    <Zap size={18} className="text-accent" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-text-primary">&lt;3 dtk</p>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Waktu respon bot</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-dim mb-3">
                    <ShieldCheck size={18} className="text-accent" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-text-primary">100%</p>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Data terenkripsi</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {showStats && <div className="section-divider max-w-4xl mx-auto" />}

      {/* ─── FEATURES ─── */}
      <section id="fitur" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Fitur</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Bukan sekadar bot catat keuangan
              </h2>
              <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">
                Sederhana dipakai, tapi canggih di balik layar. Fitur lengkap untuk bantu kamu atur keuangan tanpa ribet.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={0.1 * i}>
                <GlowCard className="h-full">
                  <div className="w-12 h-12 rounded-2xl bg-accent-dim flex items-center justify-center mb-5 border border-accent/20">
                    <f.icon size={22} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
                </GlowCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Dashboard</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Pantau keuangan secara visual
              </h2>
              <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">
                Selain dari WhatsApp, kamu juga bisa lihat data keuanganmu lewat dashboard web yang rapi dan interaktif.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <GlowCard className="p-0! overflow-hidden rounded-2xl!">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border-subtle bg-bg-card-hover/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger/40" />
                  <div className="w-3 h-3 rounded-full bg-accent/30" />
                  <div className="w-3 h-3 rounded-full bg-success/40" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-bg-primary rounded-lg px-3 py-1 text-xs text-text-muted font-mono text-center max-w-xs mx-auto">
                    izincatat.id/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Summary cards row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">Saldo Total</p>
                    <p className="text-sm sm:text-lg font-bold text-text-primary">Rp2.465.000</p>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">Masuk Hari Ini</p>
                    <p className="text-sm sm:text-lg font-bold text-success flex items-center gap-1">
                      <ArrowUpRight size={14} />Rp150.000
                    </p>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">Keluar Hari Ini</p>
                    <p className="text-sm sm:text-lg font-bold text-danger flex items-center gap-1">
                      <ArrowDownRight size={14} />Rp85.000
                    </p>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">Total Transaksi</p>
                    <p className="text-sm sm:text-lg font-bold text-text-primary">142</p>
                  </div>
                </div>

                {/* Chart + Category row */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {/* Chart area */}
                  <div className="sm:col-span-3 bg-bg-primary rounded-xl p-4 border border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-medium text-text-primary">Tren 7 Hari Terakhir</p>
                      <TrendingUp size={14} className="text-accent" />
                    </div>
                    {/* Faux bar chart */}
                    <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-32">
                      {[55, 30, 70, 45, 80, 35, 65].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-1 items-center justify-end h-full">
                          <div className="w-full flex flex-col gap-0.5 justify-end h-full">
                            <div
                              className="w-full bg-success/30 rounded-t-sm"
                              style={{ height: `${h}%` }}
                            />
                            <div
                              className="w-full bg-danger/30 rounded-b-sm"
                              style={{ height: `${Math.max(15, h - 20)}%` }}
                            />
                          </div>
                          <span className="text-[8px] sm:text-[10px] text-text-muted">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="sm:col-span-2 bg-bg-primary rounded-xl p-4 border border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-medium text-text-primary">Kategori</p>
                      <PieChart size={14} className="text-accent" />
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Makanan', pct: 40, color: 'bg-orange-400' },
                        { name: 'Transport', pct: 25, color: 'bg-blue-400' },
                        { name: 'Belanja', pct: 20, color: 'bg-pink-400' },
                        { name: 'Lainnya', pct: 15, color: 'bg-gray-400' },
                      ].map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-text-secondary">{cat.name}</span>
                            <span className="text-text-muted">{cat.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
                            <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlowCard>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── DEMO CHAT ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Live Demo</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Seperti ngobrol biasa
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <AnimatedChat />
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Cara Kerja</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Mulai dalam 60 detik
              </h2>
              <p className="text-text-muted text-sm sm:text-base">
                Tidak ada proses panjang. Tidak ada verifikasi email. Langsung jalan.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((s, i) => (
              <AnimatedSection key={s.num} delay={0.15 * i}>
                <div className="relative text-center md:text-left">
                  <div className="step-number mx-auto md:mx-0 mb-5">{s.num}</div>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-18 right-0 h-px bg-linear-to-r from-accent/30 to-transparent" style={{ width: 'calc(100% - 56px)' }} />
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── CONTOH PERINTAH ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Contoh Pesan</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Semua bisa lewat chat
              </h2>
              <p className="text-text-muted text-sm sm:text-base">
                Tulis sesantai kamu ngobrol. Bot cukup pintar untuk mengerti.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {exampleMessages.map((m) => (
                <GlowCard key={m.text} className="flex items-start gap-4 py-4! sm:py-5!">
                  <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-text-primary break-words">&ldquo;{m.text}&rdquo;</p>
                    <p className="text-xs sm:text-sm text-text-muted mt-1">{m.desc}</p>
                  </div>
                </GlowCard>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── PRICING ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Harga</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Harga yang masuk akal
              </h2>
              <p className="text-text-muted text-sm sm:text-base">
                Mulai gratis. Upgrade kalau sudah cocok.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Gratis */}
            <AnimatedSection delay={0}>
              <GlowCard className="flex flex-col h-full">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Gratis</p>
                <p className="text-4xl font-black text-text-primary mb-1">Rp0</p>
                <p className="text-text-muted text-sm mb-7">Gratis selamanya</p>
                <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> 50 transaksi per bulan</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Catat via teks &amp; voice note</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Dashboard &amp; laporan dasar</li>
                </ul>
                <a
                  href={waLink('Halo, saya mau coba Izin Catat!')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 block text-center text-sm font-medium border border-border-card text-text-primary px-4 py-3 rounded-full hover:bg-bg-card-hover hover:border-text-muted transition-all"
                >
                  Mulai Gratis
                </a>
              </GlowCard>
            </AnimatedSection>

            {/* Pro */}
            <AnimatedSection delay={0.1}>
              <div className="relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold bg-accent text-bg-primary px-4 py-1 rounded-full tracking-wide">
                  Populer
                </span>
                <GlowCard className="flex flex-col h-full pricing-popular">
                  <p className="text-xs font-medium text-accent uppercase tracking-widest mb-4">Pro</p>
                  <div className="flex items-end gap-1 mb-1">
                    <p className="text-4xl font-black text-text-primary">{formatHarga(hargaPro)}</p>
                    <p className="text-text-muted text-sm mb-1.5">/bulan</p>
                  </div>
                  <p className="text-text-muted text-sm mb-7">Untuk pemakaian harian</p>
                  <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                    <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> 500 transaksi per bulan</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Dashboard &amp; laporan lengkap</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Reminder harian otomatis</li>
                  </ul>
                  <a
                    href={waLink('Halo, saya tertarik paket Pro!')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 block text-center text-sm font-semibold bg-accent text-bg-primary px-4 py-3 rounded-full hover:brightness-110 transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Pilih Pro
                  </a>
                </GlowCard>
              </div>
            </AnimatedSection>

            {/* Couple */}
            <AnimatedSection delay={0.2}>
              <GlowCard className="flex flex-col h-full">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Couple</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-black text-text-primary">{formatHarga(hargaCouple)}</p>
                  <p className="text-text-muted text-sm mb-1.5">/bulan</p>
                </div>
                <p className="text-text-muted text-sm mb-7">2 akun, 1 data bersama</p>
                <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Semua fitur Pro</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Transaksi tidak terbatas</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> Digest &amp; recap mingguan</li>
                </ul>
                <a
                  href={waLink('Halo, saya tertarik paket Couple!')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 block text-center text-sm font-medium border border-border-card text-text-primary px-4 py-3 rounded-full hover:bg-bg-card-hover hover:border-text-muted transition-all"
                >
                  Pilih Couple
                </a>
              </GlowCard>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative">
        {/* Background glow */}
        <div className="hero-glow w-100 h-100 bg-accent/20 top-0 left-1/2 -translate-x-1/2" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <GlowCard className="py-14! sm:py-20! px-6! sm:px-10!">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
                Masih nunggu awal bulan
                <br />
                <span className="text-accent">buat mulai?</span>
              </h2>
              <p className="text-text-muted text-sm sm:text-base mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
                Semakin cepat kamu mulai, semakin jelas kamu tahu uang kamu pergi ke mana.
                Mulai sekarang — gratis, tanpa ribet.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 bg-accent text-bg-primary font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base hover:brightness-110 transition-all hover:shadow-xl hover:shadow-accent/25"
              >
                Coba Gratis Sekarang
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
            </GlowCard>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border-card/50 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Logo size={24} />
                <span className="text-sm tracking-tight">
                  <span className="font-light text-text-secondary">Izin</span><span className="font-black text-text-primary">Catat</span>
                </span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Asisten keuangan pribadi via WhatsApp. Catat, pantau, dan kelola keuanganmu tanpa ribet.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Navigasi</p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#fitur" className="hover:text-text-primary transition-colors">Fitur</a></li>
                <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">Hubungi Kami</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Kontak</p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors flex items-center gap-2">
                    <MessageSquare size={14} />
                    WhatsApp: 0878-9669-5791
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border-card/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-text-muted text-xs">&copy; 2026 IzinCatat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
