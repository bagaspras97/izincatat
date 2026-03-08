// Utility murni — tidak ada 'use client', aman diimport dari Server Component maupun Client Component.

const KATEGORI_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#E8FF57',
  'Transportasi': '#60A5FA',
  'Belanja': '#F472B6',
  'Tagihan': '#F87171',
  'Hiburan': '#A78BFA',
  'Kesehatan': '#4ADE80',
  'Pendidikan': '#FBBF24',
  'Gaji': '#34D399',
  'Transfer': '#38BDF8',
  'Lainnya': '#666666',
};

export function getKategoriColor(kategori: string): string {
  return KATEGORI_COLORS[kategori] || '#666666';
}
