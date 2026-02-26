/**
 * Template Pesan — Izin Catat
 * Semua template pesan bot dikumpulkan di sini agar mudah di-maintain.
 * Karakter bot: sopan, selalu bilang "Izin", panggil user "Kak", friendly.
 */

const { formatRupiah, formatTanggal, formatTanggalLengkap } = require('./formatter');

// ═══════════════════════════════════════════════
//  PESAN SAMBUTAN & MENU
// ═══════════════════════════════════════════════

/**
 * Pesan sambutan untuk user baru
 */
const pesanSelamatDatang = (nama = 'Kak') => {
  const namaDisplay = nama;
  return (
    `*Halo ${namaDisplay}!*\n\n` +
    `Perkenalkan, saya *Izin Catat* — asisten pencatatan keuangan Kakak di WhatsApp.\n\n` +
    `─────────────────────\n` +
    `*PERINTAH TERSEDIA*\n` +
    `─────────────────────\n\n` +
    `*Catat Transaksi*\n` +
    `   catat keluar [nominal] [keterangan]\n` +
    `   catat masuk [nominal] [keterangan]\n` +
    `   bayar [nominal] [keterangan]\n` +
    `   _(nominal boleh di awal atau akhir)_\n\n` +
    `*Cek Saldo*\n` +
    `   saldo\n\n` +
    `*Laporan*\n` +
    `   laporan hari\n` +
    `   laporan minggu\n` +
    `   laporan bulan\n\n` +
    `*Riwayat*\n` +
    `   riwayat\n\n` +
    `*Hapus Transaksi*\n` +
    `   hapus [id]\n\n` +
    `*Bantuan*\n` +
    `   bantuan / help / menu\n\n` +    `*Pesan Suara* \ud83c\udfa4\n` +
    `   Kirim voice note, bot akan dengar otomatis!\n\n` +    `─────────────────────\n` +
    `Yuk mulai catat sekarang, Kak!`
  );
};

/**
 * Pesan untuk user yang sudah terdaftar kirim pesan tidak dikenali
 */
const pesanBantuan = () => {
  return (
    `*Izin Catat — Daftar Perintah*\n\n` +
    `*CATAT TRANSAKSI*\n` +
    `   _catat keluar 25000 makan siang_\n` +
    `   _catat keluar makan siang 25000_\n` +
    `   _catat masuk 5000000 gaji bulanan_\n` +
    `   _bayar 25000 makan siang_\n` +
    `   _(nominal boleh di awal atau akhir keterangan)_\n\n` +
    `*CEK SALDO*\n` +
    `   Ketik: *saldo*\n\n` +
    `*LAPORAN*\n` +
    `   _laporan hari_   → Hari ini\n` +
    `   _laporan minggu_ → 7 hari terakhir\n` +
    `   _laporan bulan_  → Bulan ini\n\n` +
    `*RIWAYAT*\n` +
    `   Ketik: *riwayat*\n\n` +
    `*HAPUS*\n` +
    `   _hapus 42_ (ganti 42 dengan ID transaksi)\n\n` +
    `─────────────────────\n` +
    `Ketik *bantuan* kapan saja untuk melihat menu ini.`
  );
};

// ═══════════════════════════════════════════════
//  PESAN TRANSAKSI
// ═══════════════════════════════════════════════

/**
 * Konfirmasi transaksi berhasil dicatat
 */
const pesanTransaksiBerhasil = (transaksi, saldoHariIni) => {
  const jenisLabel = transaksi.jenis === 'keluar' ? 'Pengeluaran' : 'Pemasukan';
  const tanda = transaksi.jenis === 'keluar' ? '-' : '+';

  return (
    `✅ *Tercatat!*\n\n` +
    `${jenisLabel}: *${tanda}${formatRupiah(transaksi.nominal)}*\n` +
    `Keterangan : ${transaksi.keterangan}\n` +
    `Kategori   : ${transaksi.kategori}\n` +
    `Tanggal    : ${formatTanggal(transaksi.tanggal)}\n` +
    `ID         : #${transaksi.id}\n\n` +
    `─────────────────────\n` +
    `*Saldo Hari Ini*\n` +
    `Masuk  : ${formatRupiah(saldoHariIni.pemasukan)}\n` +
    `Keluar : ${formatRupiah(saldoHariIni.pengeluaran)}\n` +
    `Bersih : *${formatRupiah(saldoHariIni.saldo)}*\n\n` +
    `_Salah catat? Ketik hapus #${transaksi.id}_`
  );
};

// ═══════════════════════════════════════════════
//  PESAN SALDO
// ═══════════════════════════════════════════════

/**
 * Format pesan saldo
 */
const pesanSaldo = (saldoHari, saldoBulan) => {
  return (
    `*Saldo Kakak*\n\n` +
    `*Hari Ini*\n` +
    `Masuk  : ${formatRupiah(saldoHari.pemasukan)}\n` +
    `Keluar : ${formatRupiah(saldoHari.pengeluaran)}\n` +
    `Bersih : *${formatRupiah(saldoHari.saldo)}*\n\n` +
    `─────────────────────\n` +
    `*Bulan Ini*\n` +
    `Masuk  : ${formatRupiah(saldoBulan.pemasukan)}\n` +
    `Keluar : ${formatRupiah(saldoBulan.pengeluaran)}\n` +
    `Bersih : *${formatRupiah(saldoBulan.saldo)}*`
  );
};

// ═══════════════════════════════════════════════
//  PESAN LAPORAN
// ═══════════════════════════════════════════════

/**
 * Format pesan laporan lengkap
 */
const pesanLaporan = (data) => {
  let text =
    `*LAPORAN ${data.labelPeriode.toUpperCase()}*\n` +
    `${formatTanggalLengkap(new Date())}\n\n` +
    `Masuk  : ${formatRupiah(data.totalMasuk)}\n` +
    `Keluar : ${formatRupiah(data.totalKeluar)}\n` +
    `──────────────────────\n` +
    `Bersih : *${formatRupiah(data.saldo)}*\n`;

  // Breakdown per kategori
  if (data.breakdown && data.breakdown.length > 0) {
    text += `\n*Pengeluaran per Kategori*\n`;
    const totalKeluar = Number.parseFloat(data.totalKeluar) || 1;

    for (const item of data.breakdown) {
      const persen = ((Number.parseFloat(item.total) / totalKeluar) * 100).toFixed(1);
      text += `• ${item.kategori}: ${formatRupiah(item.total)} (${persen}%)\n`;
    }
  }

  // 5 transaksi terakhir
  if (data.transaksiTerakhir && data.transaksiTerakhir.length > 0) {
    text += `\n*5 Transaksi Terakhir*\n`;
    for (const trx of data.transaksiTerakhir) {
      const tanda = trx.jenis === 'masuk' ? '+' : '-';
      text += `${tanda}${formatRupiah(trx.nominal)} — ${trx.keterangan} (${formatTanggal(trx.tanggal)})\n`;
    }
  }

  return text;
};

// ═══════════════════════════════════════════════
//  PESAN RIWAYAT
// ═══════════════════════════════════════════════

/**
 * Format pesan riwayat transaksi
 */
const pesanRiwayat = (transaksiList, total) => {
  if (!transaksiList || transaksiList.length === 0) {
    return (
      `*Belum ada transaksi yang tercatat, Kak.*\n\n` +
      `Mulai catat dengan perintah:\n` +
      `_catat keluar 25000 makan siang_`
    );
  }

  let text = `*Riwayat Transaksi* (${transaksiList.length} dari ${total})\n\n`;

  for (let i = 0; i < transaksiList.length; i++) {
    const trx = transaksiList[i];
    const no = i + 1;
    const tanda = trx.jenis === 'masuk' ? '+' : '-';

    text +=
      `${no}. *${tanda}${formatRupiah(trx.nominal)}*\n` +
      `   ${trx.keterangan} • ${trx.kategori}\n` +
      `   ${formatTanggal(trx.tanggal)} • ID: #${trx.id}\n\n`;
  }

  text += `──────────────────────\n`;
  text += `_Hapus transaksi: hapus [id]_`;

  return text;
};

// ═══════════════════════════════════════════════
//  PESAN HAPUS
// ═══════════════════════════════════════════════

/**
 * Konfirmasi sebelum hapus transaksi
 */
const pesanKonfirmasiHapus = (trx) => {
  const jenisLabel = trx.jenis === 'keluar' ? 'Pengeluaran' : 'Pemasukan';

  return (
    `⚠️ *Konfirmasi Hapus*\n\n` +
    `ID         : #${trx.id}\n` +
    `Jenis      : ${jenisLabel}\n` +
    `Nominal    : ${formatRupiah(trx.nominal)}\n` +
    `Keterangan : ${trx.keterangan}\n` +
    `Tanggal    : ${formatTanggal(trx.tanggal)}\n\n` +
    `Ketik *ya* untuk hapus, *batal* untuk membatalkan.`
  );
};

/**
 * Pesan transaksi berhasil dihapus
 */
const pesanHapusBerhasil = (trx) => {
  return (
    `✅ Transaksi #${trx.id} berhasil dihapus.\n` +
    `${trx.keterangan} — ${formatRupiah(trx.nominal)}`
  );
};

/**
 * Pesan batal hapus
 */
const pesanBatalHapus = () => {
  return `Penghapusan dibatalkan. Data tetap aman.`;
};

// ═══════════════════════════════════════════════
//  PESAN ERROR
// ═══════════════════════════════════════════════

const pesanErrorFormat = () => {
  return (
    `Format kurang tepat, Kak.\n\n` +
    `Contoh:\n` +
    `_catat keluar 25000 makan siang_\n` +
    `_catat masuk 5000000 gaji_\n\n` +
    `Ketik *bantuan* untuk melihat semua perintah.`
  );
};

const pesanErrorNominal = () => {
  return (
    `Nominal tidak valid, Kak.\n\n` +
    `Contoh: _catat keluar 25000 makan siang_`
  );
};

const pesanErrorTransaksiNotFound = (id) => {
  return (
    `Transaksi #${id} tidak ditemukan.\n` +
    `Cek riwayat dengan ketik *riwayat*.`
  );
};

const pesanErrorUmum = () => {
  return `Maaf, ada masalah teknis. Coba lagi dalam beberapa saat.`;
};

const pesanTidakDikenali = () => {
  return `Perintah tidak dikenali. Ketik *bantuan* untuk melihat daftar perintah.`;
};

const pesanKonfirmasiExpired = () => {
  return `Waktu konfirmasi sudah habis. Ulangi perintah hapus jika masih diperlukan.`;
};

const pesanKonfirmasiTidakDikenali = () => {
  return `Ketik *ya* untuk hapus, atau *batal* untuk membatalkan.`;
};

module.exports = {
  pesanSelamatDatang,
  pesanBantuan,
  pesanTransaksiBerhasil,
  pesanSaldo,
  pesanLaporan,
  pesanRiwayat,
  pesanKonfirmasiHapus,
  pesanHapusBerhasil,
  pesanBatalHapus,
  pesanKonfirmasiExpired,
  pesanKonfirmasiTidakDikenali,
  pesanErrorFormat,
  pesanErrorNominal,
  pesanErrorTransaksiNotFound,
  pesanErrorUmum,
  pesanTidakDikenali,
};
