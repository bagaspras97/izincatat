'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { FloatingElements } from '@/components/landing/FloatingElements';
import { TypingText } from '@/components/landing/TypingText';
import { AnimatedChat } from '@/components/landing/AnimatedChat';
import { GlowCard } from '@/components/landing/GlowCard';
import {
  MessageSquare,
  Mic,
  Tag,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Zap,
  Terminal,
} from 'lucide-react';

/* ─── DATA ─── */

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
    icon: Tag,
    title: 'Kategori Otomatis, Nol Usaha',
    desc: 'Tulis apa saja secara natural. Sistem mengenali konteks dan memilih kategori yang tepat.',
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
    desc: 'Data tersimpan aman dan tidak dibagikan ke pihak manapun. Kamu yang pegang kendali penuh.',
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

const commands = [
  { cmd: 'catat keluar nasi goreng 25rb', desc: 'Catat pengeluaran dengan keterangan' },
  { cmd: 'catat masuk gaji 5jt', desc: 'Catat pemasukan' },
  { cmd: 'saldo', desc: 'Cek berapa sisa saldo kamu' },
  { cmd: 'laporan', desc: 'Ringkasan keuangan bulan ini' },
  { cmd: 'riwayat', desc: 'Lihat 10 transaksi terakhir' },
  { cmd: 'hapus 1', desc: 'Hapus transaksi yang salah catat' },
];

const WA_LINK = 'https://wa.me/6281234567890?text=Halo';

function formatHarga(n: number): string {
  if (n === 0) return 'Gratis';
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return n.toLocaleString('id-ID');
}

/* ─── COMPONENT ─── */

export default function LandingPage() {
  const [hargaPro, setHargaPro] = useState(15000);
  const [hargaCouple, setHargaCouple] = useState(29000);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setHargaPro(d.harga_pro);
          setHargaCouple(d.harga_couple);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-card/50 bg-bg-primary/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <span className="text-sm sm:text-base tracking-tight">
            <span className="font-light text-text-secondary">Izin</span><span className="font-black text-text-primary">Catat</span>
          </span>
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
        <div className="hero-glow w-[500px] h-[500px] bg-accent/30 -top-40 -left-40" />
        <div className="hero-glow w-[400px] h-[400px] bg-accent/20 bottom-20 right-0" style={{ animationDelay: '3s' }} />
        <div className="hero-glow w-[300px] h-[300px] bg-accent/15 top-1/3 right-1/4" style={{ animationDelay: '5s' }} />

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

      {/* ─── FEATURES ─── */}
      <section id="fitur" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Fitur</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Bukan sekadar bot catat-catat
              </h2>
              <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">
                Fitur yang terasa ringan dipakai, tapi cukup powerful untuk kebutuhan sehari-hari.
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
                    <div className="hidden md:block absolute top-7 left-[72px] right-0 h-px bg-gradient-to-r from-accent/30 to-transparent" style={{ width: 'calc(100% - 56px)' }} />
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

      {/* ─── COMMANDS ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Perintah</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Semua bisa lewat chat
              </h2>
              <p className="text-text-muted text-sm sm:text-base">
                Tulis sesantai kamu ngobrol. Bot cukup pintar untuk mengerti.
              </p>
            </div>
          </AnimatedSection>

          {/* Terminal-like container */}
          <AnimatedSection delay={0.1}>
            <GlowCard className="!p-0 !rounded-2xl overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border-subtle bg-bg-card-hover/50">
                <Terminal size={14} className="text-accent" />
                <span className="text-xs text-text-muted font-mono">izincatat — WhatsApp</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger/40" />
                  <div className="w-3 h-3 rounded-full bg-accent/30" />
                  <div className="w-3 h-3 rounded-full bg-success/40" />
                </div>
              </div>

              {/* Command list */}
              <div className="divide-y divide-border-subtle">
                {commands.map((c) => (
                  <div
                    key={c.cmd}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-bg-card-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-accent text-xs font-mono">$</span>
                      <code className="text-accent text-xs sm:text-sm font-mono">
                        {c.cmd}
                      </code>
                    </div>
                    <span className="text-text-muted text-xs sm:text-sm sm:ml-auto">{c.desc}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
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
            {/* Trial */}
            <AnimatedSection delay={0}>
              <GlowCard className="flex flex-col h-full">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Trial</p>
                <p className="text-4xl font-black text-text-primary mb-1">Gratis</p>
                <p className="text-text-muted text-sm mb-7">30 hari pertama</p>
                <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Semua fitur tersedia</li>
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Tanpa kartu kredit</li>
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Tidak perlu daftar email</li>
                </ul>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 block text-center text-sm font-medium border border-border-card text-text-primary px-4 py-3 rounded-full hover:bg-bg-card-hover hover:border-text-muted transition-all"
                >
                  Mulai Gratis
                </a>
              </GlowCard>
            </AnimatedSection>

            {/* Basic */}
            <AnimatedSection delay={0.1}>
              <GlowCard className="flex flex-col h-full">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Basic</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-black text-text-primary">{formatHarga(hargaPro)}</p>
                  <p className="text-text-muted text-sm mb-1.5">/bulan</p>
                </div>
                <p className="text-text-muted text-sm mb-7">Untuk pemakaian harian</p>
                <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Semua fitur tersedia</li>
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Hingga 500 transaksi/bulan</li>
                  <li className="flex items-center gap-2"><span className="text-accent">✓</span> Dashboard &amp; laporan lengkap</li>
                </ul>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 block text-center text-sm font-medium border border-border-card text-text-primary px-4 py-3 rounded-full hover:bg-bg-card-hover hover:border-text-muted transition-all"
                >
                  Pilih Basic
                </a>
              </GlowCard>
            </AnimatedSection>

            {/* Pro */}
            <AnimatedSection delay={0.2}>
              <div className="relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold bg-accent text-bg-primary px-4 py-1 rounded-full tracking-wide">
                  Populer
                </span>
                <GlowCard className="flex flex-col h-full pricing-popular">
                  <p className="text-xs font-medium text-accent uppercase tracking-widest mb-4">Pro</p>
                  <div className="flex items-end gap-1 mb-1">
                    <p className="text-4xl font-black text-text-primary">{formatHarga(hargaCouple)}</p>
                    <p className="text-text-muted text-sm mb-1.5">/bulan</p>
                  </div>
                  <p className="text-text-muted text-sm mb-7">Tanpa batas, tanpa khawatir</p>
                  <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                    <li className="flex items-center gap-2"><span className="text-accent">✓</span> Semua fitur Basic</li>
                    <li className="flex items-center gap-2"><span className="text-accent">✓</span> Transaksi tidak terbatas</li>
                    <li className="flex items-center gap-2"><span className="text-accent">✓</span> Reminder &amp; digest mingguan</li>
                  </ul>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 block text-center text-sm font-semibold bg-accent text-bg-primary px-4 py-3 rounded-full hover:brightness-110 transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Pilih Pro
                  </a>
                </GlowCard>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative">
        {/* Background glow */}
        <div className="hero-glow w-[400px] h-[400px] bg-accent/20 top-0 left-1/2 -translate-x-1/2" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <GlowCard className="!py-14 sm:!py-20 !px-6 sm:!px-10">
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
                Ya, Saya Mau Mulai
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
            </GlowCard>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border-card/50 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm tracking-tight">
            <span className="font-light text-text-muted">Izin</span><span className="font-black text-text-muted">Catat</span>
          </span>
          <p className="text-text-muted text-xs text-center sm:text-left">
            Asisten keuangan pribadi via WhatsApp.
          </p>
          <p className="text-text-muted text-xs">© 2026 IzinCatat</p>
        </div>
      </footer>
    </div>
  );
}
