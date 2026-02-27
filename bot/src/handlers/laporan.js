/**
 * Handler Laporan — Izin Catat
 * Menangani command "laporan hari/minggu/bulan".
 * Grafik ditampilkan di web dashboard, bukan via WhatsApp.
 */

const { getLaporan } = require('../database/queries');
const { pesanLaporan, pesanErrorUmum } = require('../utils/pesan');

/**
 * Handle command "laporan [periode]".
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {string} pesan - Pesan lengkap (mis. "laporan minggu")
 * @param {object} user - Data user dari database
 */
async function handleLaporan(sock, sender, pesan, user) {
  try {
    // Parse periode dari pesan
    const parts = pesan.trim().toLowerCase().split(/\s+/);
    let periode = parts[1] || 'hari'; // Default ke hari ini

    // Normalisasi input
    const aliasHari = ['hari', 'harian', 'today'];
    const aliasMinggu = ['minggu', 'mingguan', 'week', '7hari'];
    const aliasBulan = ['bulan', 'bulanan', 'month'];

    if (aliasHari.includes(periode)) {
      periode = 'hari';
    } else if (aliasMinggu.includes(periode)) {
      periode = 'minggu';
    } else if (aliasBulan.includes(periode)) {
      periode = 'bulan';
    } else {
      // Jika tidak dikenali, default hari ini
      periode = 'hari';
    }

    // Ambil data laporan dari database
    const data = await getLaporan(user.id, periode); // NOSONAR

    // Buat link ke website
    const webBase = process.env.WEB_URL;
    const webUrl = webBase ? `${webBase}/${user.publicId}/laporan` : null;

    // Kirim teks laporan
    await sock.sendMessage(sender, {
      text: pesanLaporan(data, webUrl),
    });
  } catch (error) {
    console.error('Error handleLaporan:', error);
    await sock.sendMessage(sender, { text: pesanErrorUmum() });
  }
}

module.exports = { handleLaporan };
