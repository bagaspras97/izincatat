/**
 * Kategorisasi Service — Izin Catat
 * Auto-kategorisasi transaksi berdasarkan keyword dalam keterangan.
 */

// Mapping keyword → kategori
const KATEGORI_MAP = {
  'Makanan & Minuman': [
    'makan', 'minum', 'kopi', 'resto', 'restoran', 'cafe', 'warung',
    'nasi', 'ayam', 'bakso', 'mie', 'sate', 'es', 'jus', 'teh',
    'snack', 'jajan', 'sarapan', 'brunch', 'lunch', 'dinner',
    'indomie', 'pizza', 'burger', 'sushi', 'roti',
  ],
  'Transportasi': [
    'transport', 'grab', 'gojek', 'bensin', 'parkir', 'tol',
    'bus', 'kereta', 'ojek', 'taxi', 'taksi', 'bbm', 'solar',
    'maxim', 'angkot', 'mrt', 'lrt', 'transjakarta',
  ],
  'Belanja Online': [
    'belanja', 'shopee', 'tokopedia', 'lazada', 'beli', 'mall',
    'pasar', 'supermarket', 'minimarket', 'indomaret', 'alfamart',
    'toko', 'bukalapak', 'blibli',
  ],
  'Tagihan': [
    'tagihan', 'listrik', 'air', 'internet', 'wifi', 'pulsa',
    'pdam', 'pln', 'indihome', 'telkom', 'token', 'cicilan',
    'kredit', 'asuransi', 'pajak', 'iuran', 'sewa', 'kos', 'kost',
  ],
  'Pendapatan': [
    'gaji', 'salary', 'freelance', 'bonus', 'honor', 'upah',
    'transfer masuk', 'penghasilan', 'pendapatan', 'invoice',
    'komisi', 'dividen', 'cashback',
  ],
  'Hiburan': [
    'hiburan', 'netflix', 'game', 'bioskop', 'spotify', 'youtube',
    'disney', 'nonton', 'tiket', 'konser', 'wisata', 'liburan',
    'rekreasi', 'karaoke', 'streaming',
  ],
  'Kesehatan': [
    'kesehatan', 'dokter', 'obat', 'apotek', 'rumah sakit', 'rs',
    'klinik', 'vitamin', 'suplemen', 'lab', 'medical', 'gigi',
    'mata', 'terapi', 'fitness', 'gym',
  ],
};

const KATEGORI_DEFAULT = 'Lain-lain';

/**
 * Tentukan kategori otomatis berdasarkan keyword dalam keterangan.
 * Jika jenis='masuk' dan tidak cocok keyword manapun, default ke 'Pendapatan'.
 *
 * @param {string} keterangan - Keterangan transaksi dari user
 * @param {string} jenis - "masuk" atau "keluar"
 * @returns {string} Nama kategori
 */
function autoKategorisasi(keterangan, jenis = 'keluar') {
  const keteranganLower = keterangan.toLowerCase();

  for (const [kategori, keywords] of Object.entries(KATEGORI_MAP)) {
    for (const keyword of keywords) {
      if (keteranganLower.includes(keyword)) {
        return kategori;
      }
    }
  }

  // Jika pemasukan tapi tidak cocok keyword, default ke Pendapatan
  if (jenis === 'masuk') {
    return 'Pendapatan';
  }

  return KATEGORI_DEFAULT;
}

module.exports = {
  autoKategorisasi,
  KATEGORI_MAP,
  KATEGORI_DEFAULT,
};
