/**
 * Formatter — Izin Catat
 * Fungsi untuk memformat angka, tanggal, dan data lain agar tampil rapi.
 */

// Nama bulan Indonesia
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const HARI = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

/**
 * Format angka menjadi format Rupiah Indonesia.
 * Contoh: 25000 → "Rp 25.000"
 * @param {number|string|Decimal} nominal
 * @returns {string}
 */
function formatRupiah(nominal) {
  const angka = Number.parseFloat(nominal) || 0;

  // Cek apakah ada desimal
  if (angka % 1 !== 0) {
    return `Rp ${angka.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `Rp ${angka.toLocaleString('id-ID')}`;
}

/**
 * Format tanggal menjadi string pendek Indonesia.
 * Contoh: "24 Feb 2026 14:30"
 * @param {Date|string} tanggal
 * @param {boolean} denganWaktu - apakah tampilkan jam
 * @returns {string}
 */
function formatTanggal(tanggal, denganWaktu = true) {
  const dt = new Date(tanggal);
  const tgl = dt.getDate();
  const bln = BULAN_PENDEK[dt.getMonth()];
  const thn = dt.getFullYear();

  let hasil = `${tgl} ${bln} ${thn}`;

  if (denganWaktu) {
    const jam = String(dt.getHours()).padStart(2, '0');
    const menit = String(dt.getMinutes()).padStart(2, '0');
    hasil += ` ${jam}:${menit}`;
  }

  return hasil;
}

/**
 * Format tanggal lengkap dengan nama hari.
 * Contoh: "Senin, 24 Februari 2026"
 * @param {Date|string} tanggal
 * @returns {string}
 */
function formatTanggalLengkap(tanggal) {
  const dt = new Date(tanggal);
  const hari = HARI[dt.getDay()];
  const tgl = dt.getDate();
  const bln = BULAN[dt.getMonth()];
  const thn = dt.getFullYear();

  return `${hari}, ${tgl} ${bln} ${thn}`;
}

/**
 * Format jenis transaksi ke label yang rapi.
 * @param {string} jenis - "masuk" atau "keluar"
 * @returns {string}
 */
function formatJenis(jenis) {
  return jenis === 'masuk' ? '💰 Pemasukan' : '💸 Pengeluaran';
}

/**
 * Pad string ke kanan agar rata.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function padRight(str, length) {
  return str.padEnd(length, ' ');
}

module.exports = {
  formatRupiah,
  formatTanggal,
  formatTanggalLengkap,
  formatJenis,
  padRight,
  BULAN,
  BULAN_PENDEK,
  HARI,
};
