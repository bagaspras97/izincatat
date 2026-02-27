/**
 * Format angka ke Rupiah
 */
export function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatTanggal(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format tanggal singkat
 */
export function formatTanggalSingkat(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

/**
 * Format angka ringkas (1.5jt, 500rb)
 */
export function formatRingkas(nominal: number): string {
  if (nominal >= 1_000_000_000) return `${(nominal / 1_000_000_000).toFixed(1)}M`;
  if (nominal >= 1_000_000) return `${(nominal / 1_000_000).toFixed(1)}jt`;
  if (nominal >= 1_000) return `${(nominal / 1_000).toFixed(0)}rb`;
  return nominal.toString();
}
