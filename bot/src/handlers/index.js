/**
 * Handler Index — Izin Catat
 * Router utama: menentukan handler mana yang harus dipanggil
 * berdasarkan pesan yang diterima dari user.
 */

const { handleStart } = require('./start');
const { handleCatat, handleHapus, handleKonfirmasiHapus, handleBayar } = require('./transaksi');
const { handleSaldo } = require('./saldo');
const { handleLaporan } = require('./laporan');
const { handleRiwayat } = require('./riwayat');
const { pesanBantuan, pesanTidakDikenali, pesanErrorUmum, pesanInfoBot } = require('../utils/pesan');
const { normalisasiAngkaKata } = require('../utils/validator');
const { detectIntent } = require('../services/intentDetector');

/**
 * State management untuk percakapan multi-step (mis. konfirmasi hapus).
 * Key: nomor WA sender
 * Value: { action, data, expiry }
 */
const userStates = new Map();

// Bersihkan state yang sudah expired secara berkala (setiap 5 menit)
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of userStates) {
    if (state.expiry && now > state.expiry) {
      userStates.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Router utama — handle semua pesan masuk.
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {string} pesan - Teks pesan dari user
 * @param {string|null} pushName - Nama profil user
 */
async function handleMessage(sock, sender, pesan, pushName) {
  try {
    // 1. Registrasi otomatis — pastikan user terdaftar
    const { user, isNew } = await handleStart(sock, sender, pushName); // NOSONAR

    // Jika user baru, pesan sambutan sudah dikirim oleh handleStart
    // Tidak perlu proses pesan lebih lanjut
    if (isNew) return;

    // Normalisasi pesan — konversi kata angka ke digit (mis. "hapus dua" → "hapus 2")
    const pesanNormal = normalisasiAngkaKata(pesan.trim());
    const pesanLower = pesanNormal.toLowerCase();

    // 2. Cek apakah user dalam state percakapan multi-step
    if (userStates.has(sender)) {
      const handled = await handleKonfirmasiHapus(sock, sender, pesanNormal, user, userStates); // NOSONAR
      if (handled) return;
    }

    // 3. Routing berdasarkan keyword pesan

    // Command: catat keluar/masuk
    if (pesanLower.startsWith('catat ')) {
      await handleCatat(sock, sender, pesanNormal, user);
      return;
    }

    // Command: bayar (shortcut untuk catat keluar)
    if (pesanLower.startsWith('bayar')) {
      await handleBayar(sock, sender, pesanNormal, user);
      return;
    }

    // Command: saldo / cek saldo
    if (pesanLower === 'saldo' || pesanLower === 'cek saldo') {
      await handleSaldo(sock, sender, user);
      return;
    }

    // Command: laporan hari/minggu/bulan
    if (pesanLower.startsWith('laporan')) {
      await handleLaporan(sock, sender, pesanNormal, user);
      return;
    }

    // Command: riwayat
    if (pesanLower === 'riwayat') {
      await handleRiwayat(sock, sender, user);
      return;
    }

    // Command: hapus [id]
    if (pesanLower.startsWith('hapus ')) {
      await handleHapus(sock, sender, pesanNormal, user, userStates);
      return;
    }

    // Command: bantuan / help / menu
    if (['bantuan', 'help', 'menu'].includes(pesanLower)) {
      await sock.sendMessage(sender, { text: pesanBantuan() });
      return;
    }

    // Sapaan umum — balas dengan menu tanpa panggil AI
    const sapaanList = ['hai', 'halo', 'halo!', 'hai!', 'hi', 'hi!', 'hey', 'hei', 'hello', 'p', 'ping', 'tes', 'test'];
    if (sapaanList.includes(pesanLower)) {
      await sock.sendMessage(sender, { text: pesanBantuan() });
      return;
    }

    // ── Fallback: AI Intent Detection ──────────────────────────────
    // Tidak ada keyword yang cocok → coba parse natural language via AI

    // Tampilkan indikator "mengetik" agar user tahu bot sedang memproses
    try { await sock.sendPresenceUpdate('composing', sender); } catch (_) {}

    const hasilAI = await detectIntent(pesanNormal);

    try { await sock.sendPresenceUpdate('paused', sender); } catch (_) {}

    if (!hasilAI.success || !hasilAI.data) {
      await sock.sendMessage(sender, { text: pesanTidakDikenali() });
      return;
    }

    const { intent, jenis, nominal, keterangan, periode, id } = hasilAI.data;

    switch (intent) {
      case 'catat': {
        if (!nominal || !keterangan) {
          await sock.sendMessage(sender, {
            text: `Izin meminta info tambahan 🙏\n\nIzin Catat butuh nominal dan keterangan untuk mencatat transaksi.\n\nContoh:\n• _catat keluar 25000 makan siang_\n• _beli kopi 25rb_`,
          });
          return;
        }
        const pesanCatat = `catat ${jenis || 'keluar'} ${nominal} ${keterangan}`;
        await handleCatat(sock, sender, pesanCatat, user);
        break;
      }
      case 'hapus': {
        if (!id) {
          await sock.sendMessage(sender, {
            text: `Izin meminta info tambahan 🙏\n\nTransaksi mana yang ingin dihapus? Ketik *riwayat* untuk melihat daftar + ID transaksi.`,
          });
          return;
        }
        await handleHapus(sock, sender, `hapus ${id}`, user, userStates);
        break;
      }
      case 'saldo':
        await handleSaldo(sock, sender, user);
        break;
      case 'laporan':
        await handleLaporan(sock, sender, `laporan ${periode || 'bulan'}`, user);
        break;
      case 'riwayat':
        await handleRiwayat(sock, sender, user);
        break;
      case 'bantuan':
        await sock.sendMessage(sender, { text: pesanBantuan() });
        break;
      case 'info_bot':
        await sock.sendMessage(sender, { text: pesanInfoBot() });
        break;
      default:
        // intent = tidak_relevan atau nilai lain
        await sock.sendMessage(sender, { text: pesanTidakDikenali() });
    }
  } catch (error) {
    console.error('Error handleMessage:', error);
    // Coba kirim pesan error ke user
    try {
      await sock.sendMessage(sender, { text: pesanErrorUmum() });
    } catch (sendError) {
      console.error('Gagal kirim pesan error:', sendError);
    }
  }
}

module.exports = {
  handleMessage,
  userStates,
};
