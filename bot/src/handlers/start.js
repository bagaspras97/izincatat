/**
 * Handler Start — Izin Catat
 * Menangani registrasi otomatis user baru dan pesan sambutan.
 */

const { getOrCreateUser } = require('../database/queries');
const { pesanSelamatDatang } = require('../utils/pesan');

// Cache user di memory agar tidak query DB setiap pesan
// Key: sender, Value: { user, expiry }
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Bersihkan cache expired setiap 10 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userCache) {
    if (now > val.expiry) userCache.delete(key);
  }
}, 10 * 60 * 1000);

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
    // Cek cache dulu — skip DB call untuk user yang sudah dikenal
    const cached = userCache.get(sender);
    if (cached && Date.now() < cached.expiry) {
      return { user: cached.user, isNew: false };
    }

    // Cache miss — query database
    const { user, isNew } = await getOrCreateUser(sender, pushName); // NOSONAR

    if (isNew) {
      const nama = pushName || 'Kak';
      console.log(`👋 User baru: ${nama} (${sender})`);
      await sock.sendMessage(sender, { text: pesanSelamatDatang(nama) });
    } else {
      // Simpan ke cache hanya user yang sudah ada (bukan user baru)
      userCache.set(sender, { user, expiry: Date.now() + CACHE_TTL });
    }

    return { user, isNew };
  } catch (error) {
    console.error('Error handleStart:', error);
    throw error;
  }
}

module.exports = { handleStart };
