import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-accent mb-4">404</p>
        <h1 className="text-xl font-bold text-text-primary mb-2">User Tidak Ditemukan</h1>
        <p className="text-text-muted text-sm mb-8">
          ID user tidak valid atau belum terdaftar. Pastikan link yang kamu akses benar.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-bg-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          ← Ke Beranda
        </Link>
      </div>
    </div>
  );
}
