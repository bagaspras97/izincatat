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
 * @param {object} transaksi
 * @param {object} saldoHariIni
 * @param {string|null} webUrl - URL website (mis. https://app.com/5/transaksi)
 */
const pesanTransaksiBerhasil = (transaksi, saldoHariIni, webUrl = null) => {
  const jenisLabel = transaksi.jenis === 'keluar' ? 'Pengeluaran' : 'Pemasukan';
  const tanda = transaksi.jenis === 'keluar' ? '-' : '+';
  const linkWeb = webUrl ? `\n🌐 Lihat di web: ${webUrl}` : '';

  return (
    `✅ *Izin mencatat!*\n\n` +
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
    `_Salah catat? Ketik hapus #${transaksi.id}_` +
    linkWeb
  );
};

// ═══════════════════════════════════════════════
//  PESAN SALDO
// ═══════════════════════════════════════════════

/**
 * Format pesan saldo
 * @param {object} saldoHari
 * @param {object} saldoBulan
 * @param {string|null} webUrl - URL website (mis. https://app.com/5/dashboard)
 */
const pesanSaldo = (saldoHari, saldoBulan, webUrl = null) => {
  const linkWeb = webUrl ? `\n\n🌐 Dashboard lengkap: ${webUrl}` : '';

  return (
    `Izin melaporkan saldo Kakak 🙏\n\n` +
    `*Hari Ini*\n` +
    `Masuk  : ${formatRupiah(saldoHari.pemasukan)}\n` +
    `Keluar : ${formatRupiah(saldoHari.pengeluaran)}\n` +
    `Bersih : *${formatRupiah(saldoHari.saldo)}*\n\n` +
    `─────────────────────\n` +
    `*Bulan Ini*\n` +
    `Masuk  : ${formatRupiah(saldoBulan.pemasukan)}\n` +
    `Keluar : ${formatRupiah(saldoBulan.pengeluaran)}\n` +
    `Bersih : *${formatRupiah(saldoBulan.saldo)}*` +
    linkWeb
  );
};

// ═══════════════════════════════════════════════
//  PESAN LAPORAN
// ═══════════════════════════════════════════════

/**
 * Format pesan laporan lengkap
 * @param {object} data
 * @param {string|null} webUrl - URL website (mis. https://app.com/5/laporan)
 */
const pesanLaporan = (data, webUrl = null) => {
  let text =
    `Izin melaporkan *LAPORAN ${data.labelPeriode.toUpperCase()}* 🙏\n` +
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

  if (webUrl) {
    text += `\n🌐 Grafik lengkap: ${webUrl}`;
  }

  return text;
};

// ═══════════════════════════════════════════════
//  PESAN RIWAYAT
// ═══════════════════════════════════════════════

/**
 * Format pesan riwayat transaksi
 * @param {Array} transaksiList
 * @param {number} total
 * @param {string|null} webUrl - URL website (mis. https://app.com/5/transaksi)
 */
const pesanRiwayat = (transaksiList, total, webUrl = null) => {
  if (!transaksiList || transaksiList.length === 0) {
    return (
      `Izin menyampaikan, belum ada transaksi yang tercatat, Kak.\n\n` +
      `Mulai catat dengan perintah:\n` +
      `_catat keluar 25000 makan siang_`
    );
  }

  let text = `Izin menampilkan *Riwayat Transaksi* (${transaksiList.length} dari ${total}) 🙏\n\n`;

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

  if (webUrl) {
    text += `\n🌐 Lihat semua: ${webUrl}`;
  }

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
    `⚠️ *Izin konfirmasi hapus*\n\n` +
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
    `✅ Izin melaporkan, transaksi #${trx.id} berhasil dihapus.\n` +
    `${trx.keterangan} — ${formatRupiah(trx.nominal)}`
  );
};

/**
 * Pesan batal hapus
 */
const pesanBatalHapus = () => {
  return `Izin menyampaikan, penghapusan dibatalkan. Data Kakak tetap aman.`;
};

// ═══════════════════════════════════════════════
//  PESAN ERROR
// ═══════════════════════════════════════════════

const pesanErrorFormat = () => {
  return (
    `Izin mengingatkan, format kurang tepat, Kak.\n\n` +
    `Contoh:\n` +
    `_catat keluar 25000 makan siang_\n` +
    `_catat masuk 5000000 gaji_\n\n` +
    `Ketik *bantuan* untuk melihat semua perintah.`
  );
};

const pesanErrorNominal = () => {
  return (
    `Izin mengingatkan, nominal tidak valid, Kak.\n\n` +
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
  return `Izin mohon maaf, ada masalah teknis. Coba lagi dalam beberapa saat.`;
};

const pesanTidakDikenali = () => {
  return `Izin menyampaikan, perintah tidak dikenali. Ketik *bantuan* untuk melihat daftar perintah.`;
};

const pesanKonfirmasiExpired = () => {
  return `Izin menyampaikan, waktu konfirmasi sudah habis. Ulangi perintah hapus jika masih diperlukan.`;
};

const pesanKonfirmasiTidakDikenali = () => {
  return `Izin mengingatkan, ketik *ya* untuk hapus, atau *batal* untuk membatalkan.`;
};

// ═══════════════════════════════════════════════
//  PESAN SCHEDULER
// ═══════════════════════════════════════════════

/**
 * Reminder harian untuk user yang belum catat hari ini
 * @param {string} nama
 * @param {string|null} webUrl
 */
const pesanReminderHarian = (nama = 'Kak', webUrl = null) => {
  const namaDisplay = nama || 'Kak';
  const linkWeb = webUrl ? `\n\n🌐 Lihat catatan Kakak: ${webUrl}` : '';

  return (
    `⏰ *Reminder Harian — Izin Catat*\n\n` +
    `Hai Kak *${namaDisplay}*! Izin mengingatkan 🙏\n\n` +
    `Hari ini Kakak belum mencatat transaksi apapun.\n` +
    `Yuk catat sekarang agar keuangan Kakak tetap terpantau!\n\n` +
    `─────────────────────\n` +
    `Contoh:\n` +
    `   _catat keluar 25000 makan malam_\n` +
    `   _catat masuk 500000 transfer_\n\n` +
    `Ketik *saldo* untuk cek kondisi keuangan hari ini.` +
    linkWeb
  );
};

/**
 * Weekly digest mingguan — ringkasan minggu lalu + perbandingan
 * @param {string} nama
 * @param {object} data - hasil getWeeklyDigestData()
 * @param {string|null} webUrl
 */
const pesanWeeklyDigest = (nama = 'Kak', data, webUrl = null) => {
  const namaDisplay = nama || 'Kak';
  const { mingguLalu, mingguSebelumnya } = data;

  // Format tanggal range
  const opsiTanggal = { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' };
  const tglMulai = mingguLalu.mulai.toLocaleDateString('id-ID', opsiTanggal);
  const tglSelesai = new Date(mingguLalu.selesai.getTime() - 1).toLocaleDateString('id-ID', opsiTanggal);

  // Perbandingan pengeluaran
  let infoPerbandingan = '';
  if (mingguSebelumnya.totalKeluar > 0) {
    const selisih = mingguLalu.totalKeluar - mingguSebelumnya.totalKeluar;
    const persen = Math.abs((selisih / mingguSebelumnya.totalKeluar) * 100).toFixed(0);
    if (selisih < 0) {
      infoPerbandingan = `\n✅ Pengeluaran lebih *hemat ${persen}%* dibanding minggu lalu!`;
    } else if (selisih > 0) {
      infoPerbandingan = `\n⚠️ Pengeluaran *naik ${persen}%* dibanding minggu lalu.`;
    } else {
      infoPerbandingan = `\n➡️ Pengeluaran sama seperti minggu lalu.`;
    }
  }

  // Top 3 kategori
  let infoKategori = '';
  if (mingguLalu.topKategori && mingguLalu.topKategori.length > 0) {
    const totalKeluar = mingguLalu.totalKeluar || 1;
    infoKategori = `\n*Top Pengeluaran*\n`;
    for (const item of mingguLalu.topKategori) {
      const persen = ((item.total / totalKeluar) * 100).toFixed(0);
      infoKategori += `• ${item.kategori}: ${formatRupiah(item.total)} (${persen}%)\n`;
    }
  }

  // Pesan jika tidak ada transaksi sama sekali
  if (mingguLalu.jumlahTransaksi === 0) {
    const linkWeb = webUrl ? `\n\n🌐 Mulai catat: ${webUrl}` : '';
    return (
      `📊 *Ringkasan Mingguan — Izin Catat*\n` +
      `${tglMulai} – ${tglSelesai}\n\n` +
      `Hai Kak *${namaDisplay}*!\n\n` +
      `Minggu lalu Kakak belum mencatat transaksi apapun.\n` +
      `Yuk mulai catat minggu ini agar keuangan lebih terpantau! 💪\n\n` +
      `Ketik *bantuan* untuk melihat cara penggunaan.` +
      linkWeb
    );
  }

  const linkWeb = webUrl ? `\n\n🌐 Lihat grafik lengkap: ${webUrl}` : '';

  return (
    `📊 *Ringkasan Mingguan — Izin Catat*\n` +
    `${tglMulai} – ${tglSelesai}\n\n` +
    `Hai Kak *${namaDisplay}*! Ini laporan minggu lalu:\n\n` +
    `💰 Pemasukan  : *${formatRupiah(mingguLalu.totalMasuk)}*\n` +
    `💸 Pengeluaran: *${formatRupiah(mingguLalu.totalKeluar)}*\n` +
    `──────────────────────\n` +
    `💼 Bersih     : *${formatRupiah(mingguLalu.saldo)}*\n` +
    infoKategori +
    `\n📝 Total *${mingguLalu.jumlahTransaksi} transaksi* tercatat.` +
    infoPerbandingan +
    linkWeb
  );
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
  pesanReminderHarian,
  pesanWeeklyDigest,
  pesanErrorFormat,
  pesanErrorNominal,
  pesanErrorTransaksiNotFound,
  pesanErrorUmum,
  pesanTidakDikenali,
};
