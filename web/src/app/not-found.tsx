import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-accent mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-text-muted mb-8">
          Sepertinya halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
