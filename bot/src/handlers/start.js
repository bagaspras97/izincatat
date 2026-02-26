/**
 * Handler Start — Izin Catat
 * Menangani registrasi otomatis user baru dan pesan sambutan.
 */

const { getOrCreateUser } = require('../database/queries');
const { pesanSelamatDatang } = require('../utils/pesan');

/**
 * Handle user baru / registrasi otomatis.
 * Dipanggil saat user pertama kali kirim pesan.
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim (628xx@s.whatsapp.net)
 * @param {string|null} pushName - Nama profil user
 * @returns {{ user: object, isNew: boolean }}
 */
async function handleStart(sock, sender, pushName) {
  try {
    // Registrasi / ambil user dari database
    const { user, isNew } = await getOrCreateUser(sender, pushName); // NOSONAR

    // Jika user baru, kirim pesan selamat datang
    if (isNew) {
      const nama = pushName || 'Kak';
      console.log(`👋 User baru: ${nama} (${sender})`);

      await sock.sendMessage(sender, {
        text: pesanSelamatDatang(nama),
      });
    }

    return { user, isNew };
  } catch (error) {
    console.error('Error handleStart:', error);
    throw error;
  }
}

module.exports = { handleStart };
