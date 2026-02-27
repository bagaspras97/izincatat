import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    title: 'Tanpa Aplikasi Tambahan',
    desc: 'WhatsApp sudah ada di HP kamu. Kenapa harus install aplikasi lain? Langsung catat dari sana.',
  },
  {
    title: 'Cukup Bicara, AI yang Kerja',
    desc: 'Kirim voice note "habis 40rb buat bensin" — bot langsung paham, catat, dan kategorikan.',
  },
  {
    title: 'Kategori Otomatis, Nol Usaha',
    desc: 'Tulis apa saja secara natural. Sistem kami mengenali konteks dan memilih kategori yang tepat.',
  },
  {
    title: 'Laporan Tanpa Buka Laptop',
    desc: 'Tanya "laporan bulan ini" di chat dan kamu langsung tahu uang masuk, keluar, dan sisa saldo.',
  },
  {
    title: 'Dashboard Buat yang Suka Visual',
    desc: 'Grafik, breakdown kategori, tren 7 hari — semua tersaji rapi di dashboard web yang bisa diakses kapan saja.',
  },
  {
    title: '100% Gratis, Selamanya',
    desc: 'Tidak ada trial, tidak ada paket premium. Data kamu privat dan tidak dijual ke siapapun.',
  },
];

const steps = [
  { num: '01', title: 'Simpan Nomornya', desc: 'Tambahkan nomor Izin Catat ke kontak WhatsApp. Satu kali saja, selesai.' },
  { num: '02', title: 'Kirim "Halo"', desc: 'Bot langsung menyapa, daftarkan akunmu, dan siap dipakai — tanpa isi formulir.' },
  { num: '03', title: 'Catat Sesuka Hati', desc: 'Tulis natural kayak chat biasa. Atau kirim voice note kalau lagi sibuk.' },
];

const commands = [
  { cmd: 'catat nasi goreng 25rb', desc: 'Catat pengeluaran dengan keterangan' },
  { cmd: 'masuk gaji 5jt', desc: 'Catat pemasukan' },
  { cmd: 'saldo', desc: 'Cek berapa sisa saldo kamu' },
  { cmd: 'laporan', desc: 'Ringkasan keuangan bulan ini' },
  { cmd: 'riwayat', desc: 'Lihat 10 transaksi terakhir' },
  { cmd: 'hapus 1', desc: 'Hapus transaksi yang salah catat' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-card bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm sm:text-base tracking-tight"><span className="font-light text-text-secondary">Izin </span><span className="font-black text-text-primary">Catat</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <a
              href="https://wa.me/6281234567890?text=Halo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-medium bg-accent text-bg-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:brightness-110 transition-all"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 rounded-full border border-border-card bg-bg-card text-text-muted text-[11px] sm:text-xs tracking-wide">
            Bot Keuangan Pribadi
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6">
            Asisten keuangan kamu<br />
            <span className="text-accent">langsung di WhatsApp.</span>
          </h1>

          <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Izin Catat membantu kamu mencatat pemasukan & pengeluaran, memantau saldo,
            hingga melihat laporan keuangan — semua cukup dari chat WhatsApp yang sudah kamu buka setiap hari.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://wa.me/6281234567890?text=Halo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base hover:brightness-110 transition-all w-full sm:w-auto justify-center"
            >
              Coba Gratis Sekarang
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ─── DEMO CHAT ─── */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-bg-card border border-border-card rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-[#005C4B] text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                catat makan siang 35rb
              </div>
            </div>
            {/* Bot reply */}
            <div className="flex justify-start">
              <div className="bg-bg-card-hover border border-border-subtle text-text-primary text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%] space-y-1">
                <p>Tercatat! ✓</p>
                <p className="text-text-muted">Pengeluaran: makan siang</p>
                <p className="text-text-muted">Nominal: <span className="text-danger font-medium">-Rp35.000</span></p>
                <p className="text-text-muted">Kategori: <span className="text-text-secondary">Makanan</span></p>
              </div>
            </div>
            {/* User message 2 */}
            <div className="flex justify-end">
              <div className="bg-[#005C4B] text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                berapa saldo gue sekarang?
              </div>
            </div>
            {/* Bot reply 2 */}
            <div className="flex justify-start">
              <div className="bg-bg-card-hover border border-border-subtle text-text-primary text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%]">
                <p>Saldo kamu: <span className="text-accent font-semibold">Rp2.465.000</span></p>
                <p className="text-text-muted text-xs mt-1">Masuk Rp5.000.000 · Keluar Rp2.535.000</p>
              </div>
            </div>
          </div>
          <p className="text-center text-text-muted text-xs mt-4">Semua itu cukup dari chat WhatsApp biasa.</p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Bukan sekadar bot catat-catat</h2>
            <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">Fitur yang terasa ringan dipakai, tapi cukup powerful untuk kebutuhan sehari-hari.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bento-card">
                <h3 className="text-lg font-semibold mb-2 text-text-primary">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Mulai dalam 60 detik</h2>
            <p className="text-text-muted text-sm sm:text-base">Tidak ada proses panjang. Tidak ada verifikasi email. Langsung jalan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <span className="text-5xl sm:text-6xl font-black text-accent/10 absolute -top-3 sm:-top-4 -left-1">{s.num}</span>
                <div className="pt-8 sm:pt-10">
                  <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{s.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMANDS ─── */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Semua bisa lewat chat</h2>
            <p className="text-text-muted text-sm sm:text-base">Tulis sesantai kamu ngobrol. Bot kami cukup pintar untuk mengerti.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commands.map((c) => (
              <div key={c.cmd} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bento-card !py-3 sm:!py-4 !px-4 sm:!px-5">
                <code className="text-accent text-xs sm:text-sm font-mono bg-accent-dim px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg self-start">
                  {c.cmd}
                </code>
                <span className="text-text-muted text-xs sm:text-sm">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bento-card !py-10 sm:!py-16 !px-5 sm:!px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Masih nunggu awal bulan<br />
              <span className="text-accent">buat mulai?</span>
            </h2>
            <p className="text-text-muted text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Semakin cepat kamu mulai catat, semakin jelas kamu tahu uang kamu pergi ke mana.
              Mulai sekarang — gratis, tanpa ribet.
            </p>
            <a
              href="https://wa.me/6281234567890?text=Halo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base hover:brightness-110 transition-all"
            >
              Ya, Saya Mau Mulai
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border-card py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm tracking-tight"><span className="font-light text-text-muted">Izin </span><span className="font-black text-text-muted">Catat</span></span>
          </div>
          <p className="text-text-muted text-xs text-center sm:text-left">
            Bot keuangan pribadi via WhatsApp.
          </p>
          <p className="text-text-muted text-xs">© 2026 Izin Catat</p>
        </div>
      </footer>

    </div>
  );
}
