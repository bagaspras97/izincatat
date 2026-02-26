/**
 * Handler Riwayat — Izin Catat
 * Menangani command "riwayat" — menampilkan 10 transaksi terakhir.
 */

const { getRiwayat } = require('../database/queries');
const { pesanRiwayat, pesanErrorUmum } = require('../utils/pesan');

/**
 * Handle command "riwayat".
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {object} user - Data user dari database
 */
async function handleRiwayat(sock, sender, user) {
  try {
    // Ambil 10 transaksi terakhir
    const { transaksi, total } = await getRiwayat(user.id, 10); // NOSONAR

    // Format dan kirim pesan
    await sock.sendMessage(sender, {
      text: pesanRiwayat(transaksi, total),
    });
  } catch (error) {
    console.error('Error handleRiwayat:', error);
    await sock.sendMessage(sender, { text: pesanErrorUmum() });
  }
}

module.exports = { handleRiwayat };
