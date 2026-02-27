/**
 * Handler Saldo — Izin Catat
 * Menangani command "saldo" atau "cek saldo".
 */

const { getSaldoHariIni, getSaldoBulanIni } = require('../database/queries');
const { pesanSaldo, pesanErrorUmum } = require('../utils/pesan');

/**
 * Handle command "saldo" / "cek saldo".
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {object} user - Data user dari database
 */
async function handleSaldo(sock, sender, user) {
  try {
    // Ambil saldo hari ini dan bulan ini secara paralel
    const [saldoHari, saldoBulan] = await Promise.all([
      getSaldoHariIni(user.id), // NOSONAR
      getSaldoBulanIni(user.id), // NOSONAR
    ]);

    // Buat link ke website
    const webBase = process.env.WEB_URL;
    const webUrl = webBase ? `${webBase}/${user.publicId}/dashboard` : null;

    // Kirim pesan saldo
    await sock.sendMessage(sender, {
      text: pesanSaldo(saldoHari, saldoBulan, webUrl),
    });
  } catch (error) {
    console.error('Error handleSaldo:', error);
    await sock.sendMessage(sender, { text: pesanErrorUmum() });
  }
}

module.exports = { handleSaldo };
