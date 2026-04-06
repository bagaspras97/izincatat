"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { waLink } from "@/lib/wa";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { FloatingElements } from "@/components/landing/FloatingElements";
import { TypingText } from "@/components/landing/TypingText";
import { WAPhoneMockup } from "@/components/landing/WAPhoneMockup";
import { GlowCard } from "@/components/landing/GlowCard";
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
  Clock,
  X,
  ChevronDown,
  Menu,
} from "lucide-react";

/* ─── DATA ─── */

const WA_LINK = waLink("Halo");

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: MessageSquare,
    title: "Tanpa Aplikasi Tambahan",
    desc: "WhatsApp sudah ada di HP kamu. Kenapa harus install aplikasi lain? Langsung catat dari sana.",
  },
  {
    icon: Mic,
    title: "Cukup Bicara, Bot yang Kerja",
    desc: 'Kirim voice note "habis 40rb buat bensin" — bot langsung paham, catat, dan kategorikan.',
  },
  {
    icon: Zap,
    title: "Ngingetin Sebelum Kamu Lupa",
    desc: "Belum catat hari ini? Bot yang duluan kirim pesan. Tiap Senin juga ada recap mingguan biar kamu tahu uang kamu pergi ke mana.",
  },
  {
    icon: BarChart3,
    title: "Laporan Tanpa Buka Laptop",
    desc: 'Tanya "laporan bulan ini" di chat — langsung dapat ringkasan uang masuk, keluar, dan sisa saldo.',
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Buat yang Suka Visual",
    desc: "Grafik, breakdown kategori, tren 7 hari — semua tersaji rapi di dashboard web.",
  },
  {
    icon: ShieldCheck,
    title: "Data Kamu, Privasi Kamu",
    desc: "Semua catatan keuangan dienkripsi end-to-end. Hanya kamu yang bisa akses datamu.",
  },
];

const steps = [
  {
    num: "01",
    title: "Simpan Nomornya",
    desc: "Tambahkan nomor Izin Catat ke kontak WhatsApp. Satu kali saja, selesai.",
  },
  {
    num: "02",
    title: 'Kirim "Halo"',
    desc: "Bot langsung menyapa, daftarkan akunmu, dan siap dipakai — tanpa isi formulir apapun.",
  },
  {
    num: "03",
    title: "Catat Sesuka Hati",
    desc: "Tulis natural kayak chat biasa. Atau kirim voice note kalau lagi sibuk.",
  },
];

const exampleMessages = [
  { text: "catat keluar nasi goreng 25rb", desc: "Catat pengeluaran" },
  { text: "catat masuk gaji 5jt", desc: "Catat pemasukan" },
  { text: "saldo", desc: "Cek sisa saldo kamu" },
  { text: "laporan", desc: "Ringkasan keuangan bulan ini" },
  { text: "riwayat", desc: "Lihat 10 transaksi terakhir" },
  { text: "hapus 1", desc: "Hapus transaksi yang salah" },
];

const faqs = [
  {
    q: "Apa itu Izin Catat?",
    a: "Izin Catat adalah bot WhatsApp yang membantu kamu mencatat pemasukan dan pengeluaran keuangan dengan mudah, cukup lewat chat biasa. Tidak perlu aplikasi tambahan, semua bisa langsung dari WhatsApp",
  },
  {
    q: "Apakah data keuangan saya aman?",
    a: "Ya. Semua catatanmu dienkripsi secara otomatis sebelum disimpan — bahkan tim kami sendiri tidak bisa membaca isi catatanmu. Data kamu, hanya milik kamu.",
  },
  {
    q: "Apakah bot paham jika ada typo atau menggunakan bahasa sehari-hari?",
    a: 'Betul, kami menggunakan AI untuk memahami pesanmu. Tulis "Bnsin 20k" atau "makan siang dua puluh ribu" — bot tetap paham dan langsung catat.',
  },
  {
    q: "Gimana kalau saya salah catat?",
    a: 'Ketik "riwayat" di chat untuk lihat daftar transaksi, lalu "hapus [nomor]" untuk menghapus yang salah. Gampang, tanpa buka aplikasi lain.',
  },
  {
    q: "Harus registrasi atau isi formulir dulu?",
    a: 'Tidak perlu. Cukup kirim "Halo" ke nomor Izin Catat — bot langsung daftarkan akunmu otomatis.',
  },
  {
    q: "Paket gratis ada batasnya?",
    a: "Ada, maksimal 50 transaksi per bulan. Untuk pencatatan tanpa batas, upgrade ke paket Pro.",
  },
  {
    q: "Bisa dipakai berdua dengan pasangan?",
    a: "Plan Couple sedang dalam pengembangan. Nantinya 2 akun WhatsApp bisa terhubung ke 1 dashboard bersama.",
  },
];

function formatHarga(n: number): string {
  if (n === 0) return "Gratis";
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return n.toLocaleString("id-ID");
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hargaPro = initialSettings.harga_pro;
  const showStats = initialStats.users >= STATS_THRESHOLD;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4">
        <div className="max-w-6xl mx-auto rounded-2xl border border-accent/20 bg-bg-primary/80 backdrop-blur-2xl shadow-lg shadow-accent/5 ring-1 ring-inset ring-white/5">
          <div className="px-5 h-14 flex items-center justify-between gap-4">
            <a href="#" className="flex items-center gap-1.5 shrink-0">
              <Logo size={26} />
              <span className="text-lg tracking-tight leading-none">
                <span className="font-light text-text-secondary">Izin</span>
                <span className="font-black text-text-primary">Catat</span>
              </span>
            </a>

            {/* Desktop nav links — center */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-text-muted hover:text-text-primary hover:bg-accent-dim px-3.5 py-2 rounded-xl transition-all duration-150"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-accent text-bg-primary pl-4 pr-3 py-2 rounded-xl hover:brightness-110 transition-all hover:shadow-md hover:shadow-accent/25 group"
              >
                Mulai Gratis
                <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </a>
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-accent-dim transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border-card/60 px-5 py-3 flex flex-col gap-0.5">
              {[{ label: "Fitur", href: "#fitur" }, ...NAV_LINKS].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-text-muted hover:text-text-primary py-2.5 px-3 rounded-xl hover:bg-accent-dim transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 pt-2 border-t border-border-card/60">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm font-semibold bg-accent text-bg-primary px-5 py-2.5 rounded-xl hover:brightness-110 transition-all"
                >
                  Mulai Gratis
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center px-3 sm:px-6 pt-20 sm:pt-20">
        <div className="hero-glow w-125 h-125 bg-accent/30 -top-40 -left-40" />
        <div className="hero-glow w-100 h-100 bg-accent/20 bottom-20 right-0" style={{ animationDelay: "3s" }} />
        <FloatingElements />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* Mobile layout */}
          <div className="flex flex-col items-center gap-8 lg:hidden py-8">
            <AnimatedSection delay={0.1} className="w-full text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
                Catat keuangan,{" "}
                <TypingText phrase="langsung di WhatsApp." className="text-accent" />
              </h1>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                Catat pemasukan &amp; pengeluaran, pantau saldo, hingga lihat laporan keuangan — semua cukup dari WhatsApp.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="w-full flex justify-center">
                <WAPhoneMockup />
              </div>
            </AnimatedSection>
          </div>

          {/* Desktop layout — 2 kolom */}
          <div className="hidden lg:grid grid-cols-3 gap-12 xl:gap-0 items-center py-10">
            <AnimatedSection delay={0.1} className="col-span-2">
              <h1 className="text-5xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                Catat keuangan,
                <br />
                <TypingText phrase="langsung di WhatsApp." className="text-accent" />
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-lg">
                Catat pemasukan &amp; pengeluaran, pantau saldo, hingga lihat laporan keuangan — semua cukup dari WhatsApp.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.35} className="col-span-1">
              <div className="flex justify-end">
                <WAPhoneMockup />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── SOCIAL PROOF ─── */}
      {showStats && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { icon: Users, value: formatStat(initialStats.users), label: "Pengguna aktif" },
                  { icon: ArrowLeftRight, value: formatStat(initialStats.transactions), label: "Transaksi tercatat" },
                  { icon: Zap, value: "<3 dtk", label: "Waktu respon bot" },
                  { icon: ShieldCheck, value: "100%", label: "Data terenkripsi" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-dim mb-3">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-text-primary">{value}</p>
                    <p className="text-xs sm:text-sm text-text-muted mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {showStats && <div className="section-divider max-w-4xl mx-auto" />}

      {/* ─── FEATURES — Bento Grid ─── */}
      <section id="fitur" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Fitur</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Bukan sekadar bot catat keuangan
              </h2>
              <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">
                Sederhana dipakai, tapi canggih di balik layar. Bot kami menggunakan AI supaya bisa ngerti cara kamu
                ngobrol sehari-hari.
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

      {/* ─── DASHBOARD PREVIEW — Split Layout ─── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-2">
              <AnimatedSection>
                <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Dashboard</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Pantau keuangan secara visual</h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-8">
                  Selain dari WhatsApp, kamu juga bisa lihat data keuanganmu lewat dashboard web yang rapi dan
                  interaktif.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: TrendingUp, label: "Tren pemasukan & pengeluaran" },
                    { icon: PieChart, label: "Breakdown per kategori" },
                    { icon: BarChart3, label: "Perbandingan periode sebelumnya" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 border border-accent/20">
                        <Icon size={14} className="text-accent" />
                      </div>
                      <span className="text-sm text-text-secondary">{label}</span>
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            </div>

            <div className="lg:col-span-3">
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
                        izincatat.com/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard mockup */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                        <p className="text-[10px] sm:text-xs text-text-muted mb-1">Saldo Total</p>
                        <p className="text-sm sm:text-lg font-bold text-text-primary">Rp2.465.000</p>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                        <p className="text-[10px] sm:text-xs text-text-muted mb-1">Masuk Hari Ini</p>
                        <p className="text-sm sm:text-lg font-bold text-success flex items-center gap-1">
                          <ArrowUpRight size={14} />
                          Rp150.000
                        </p>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                        <p className="text-[10px] sm:text-xs text-text-muted mb-1">Keluar Hari Ini</p>
                        <p className="text-sm sm:text-lg font-bold text-danger flex items-center gap-1">
                          <ArrowDownRight size={14} />
                          Rp85.000
                        </p>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-3 sm:p-4 border border-border-subtle">
                        <p className="text-[10px] sm:text-xs text-text-muted mb-1">Total Transaksi</p>
                        <p className="text-sm sm:text-lg font-bold text-text-primary">142</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-3 bg-bg-primary rounded-xl p-4 border border-border-subtle">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-medium text-text-primary">Tren 7 Hari Terakhir</p>
                          <TrendingUp size={14} className="text-accent" />
                        </div>
                        <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-32">
                          {[55, 30, 70, 45, 80, 35, 65].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-1 items-center justify-end h-full">
                              <div className="w-full flex flex-col gap-0.5 justify-end h-full">
                                <div className="w-full bg-success/30 rounded-t-sm" style={{ height: `${h}%` }} />
                                <div
                                  className="w-full bg-danger/30 rounded-b-sm"
                                  style={{ height: `${Math.max(15, h - 20)}%` }}
                                />
                              </div>
                              <span className="text-[8px] sm:text-[10px] text-text-muted">
                                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][i]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-2 bg-bg-primary rounded-xl p-4 border border-border-subtle">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-medium text-text-primary">Kategori</p>
                          <PieChart size={14} className="text-accent" />
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { name: "Makanan", pct: 40, color: "bg-orange-400" },
                            { name: "Transport", pct: 25, color: "bg-blue-400" },
                            { name: "Belanja", pct: 20, color: "bg-pink-400" },
                            { name: "Lainnya", pct: 15, color: "bg-gray-400" },
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
          </div>
        </div>
      </section>


      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── HOW IT WORKS — Horizontal timeline ─── */}
      <section id="cara-kerja" className="py-20 sm:py-32 px-4 sm:px-6">
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
                <div className="relative">
                  <div className="step-number mb-5 mx-auto md:mx-0">{s.num}</div>
                  {/* Connector with arrow */}
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:flex absolute top-7 items-center gap-1"
                      style={{ left: "72px", right: "-12px" }}
                    >
                      <div className="flex-1 h-px bg-linear-to-r from-accent/50 to-accent/10" />
                      <ArrowRight size={12} className="text-accent/40 shrink-0" />
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center md:text-left">{s.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed text-center md:text-left">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTOH PERINTAH — Full-bleed ─── */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-bg-card border-y border-border-card" />
        <div className="relative z-10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12 sm:mb-20">
                <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">
                  Contoh Pesan
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                  Semua bisa lewat chat
                </h2>
                <p className="text-text-muted text-sm sm:text-base">
                  Tulis sesantai kamu ngobrol. Bot selalu paham, bahkan kalau typo sekalipun.
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
                      <p className="text-sm sm:text-base font-medium text-text-primary wrap-break-word">
                        &ldquo;{m.text}&rdquo;
                      </p>
                      <p className="text-xs sm:text-sm text-text-muted mt-1">{m.desc}</p>
                    </div>
                  </GlowCard>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── PRICING ─── */}
      <section id="harga" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-20">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">Harga</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Harga yang masuk akal
              </h2>
              <p className="text-text-muted text-sm sm:text-base">Mulai gratis. Upgrade kalau sudah cocok.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Gratis */}
            <AnimatedSection delay={0}>
              <GlowCard className="flex flex-col h-full">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Gratis</p>
                <p className="text-4xl font-black text-text-primary mb-1">Rp0</p>
                <p className="text-text-muted text-sm mb-7">Gratis selamanya</p>
                <ul className="space-y-2.5 text-sm flex-1">
                  <li className="flex items-center gap-2 text-text-secondary">
                    <Check size={14} className="text-accent shrink-0" /> Maksimal 50 transaksi per bulan
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <Check size={14} className="text-accent shrink-0" /> Catat via teks &amp; voice note
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <Check size={14} className="text-accent shrink-0" /> Dashboard &amp; ringkasan keuangan
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <Check size={14} className="text-accent shrink-0" /> Laporan bulanan dasar
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <Check size={14} className="text-accent shrink-0" /> Analisis kategori pengeluaran
                  </li>
                  <li className="flex items-center gap-2 text-text-muted opacity-40 line-through">
                    <X size={14} className="shrink-0" /> Export laporan ke CSV
                  </li>
                  <li className="flex items-center gap-2 text-text-muted opacity-40 line-through">
                    <X size={14} className="shrink-0" /> Reminder harian otomatis
                  </li>
                </ul>
                <a
                  href={waLink("Halo, saya mau coba Izin Catat!")}
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
                  <p className="text-text-muted text-sm mb-2">Akses penuh semua fitur</p>
                  <p className="text-xs text-accent/70 italic mb-7">
                    Cuma Rp500 sehari — keuanganmu terpantau sebulan penuh.
                  </p>
                  <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Transaksi tidak terbatas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Catat via teks &amp; voice note
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Dashboard &amp; ringkasan keuangan
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Laporan bulanan lengkap + grafik
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Analisis kategori pengeluaran
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Export laporan ke CSV
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Reminder harian otomatis via WA
                    </li>
                  </ul>
                  <a
                    href={waLink("Halo, saya tertarik paket Pro!")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 block text-center text-sm font-semibold bg-accent text-bg-primary px-4 py-3 rounded-full hover:brightness-110 transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Upgrade ke Pro
                  </a>
                </GlowCard>
              </div>
            </AnimatedSection>

            {/* Couple */}
            <AnimatedSection delay={0.2}>
              <div className="relative opacity-75">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 text-[10px] font-semibold bg-bg-primary border border-border-card text-text-muted px-3 py-1 rounded-full tracking-wide">
                  <Clock size={10} /> Segera hadir
                </span>
                <GlowCard className="flex flex-col h-full">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Couple</p>
                  <div className="flex items-end gap-1 mb-1">
                    <p className="text-4xl font-black text-text-muted">—</p>
                  </div>
                  <p className="text-text-muted text-sm mb-7">2 akun, 1 data bersama</p>
                  <ul className="space-y-2.5 text-sm text-text-secondary flex-1">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Semua fitur Pro
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> 2 akun WA, 1 dashboard bersama
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Laporan keuangan gabungan
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-accent shrink-0" /> Weekly digest pasangan
                    </li>
                  </ul>
                  <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium border border-border-card text-text-muted px-4 py-3 rounded-full cursor-not-allowed">
                    <Clock size={14} /> Dalam pengembangan
                  </div>
                </GlowCard>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-accent text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
                Pertanyaan yang sering muncul
              </h2>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="border border-border-card rounded-2xl overflow-hidden divide-y divide-border-card">
              {faqs.map((faq, i) => (
                <div key={faq.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-bg-card-hover transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-text-primary">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-text-muted shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-96" : "max-h-0"}`}
                  >
                    <p className="text-sm text-text-muted leading-relaxed px-5 sm:px-6 pb-5">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border-card/50 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Logo size={26} />
                <span className="text-md tracking-tight">
                  <span className="font-light text-text-secondary">Izin</span>
                  <span className="font-black text-text-primary">Catat</span>
                </span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Asisten keuangan pribadi via WhatsApp. Catat, pantau, dan kelola keuanganmu tanpa ribet.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Navigasi</p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>
                  <a href="#fitur" className="hover:text-text-primary transition-colors">
                    Fitur
                  </a>
                </li>
                <li>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-text-primary transition-colors"
                  >
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Kontak</p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-text-primary transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    WhatsApp: 0821-1933-818
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
