/**
 * Scheduler Service — Izin Catat
 * Pengaturan job scheduler menggunakan node-cron.
 * - Reminder harian jam 20:00 WIB → kirim ke user yang belum catat hari ini
 * - Weekly digest Senin jam 08:00 WIB → ringkasan minggu lalu + perbandingan
 */

const cron = require('node-cron');
const { getActiveUsers, countTransaksiHariIni, getWeeklyDigestData } = require('../database/queries');
const { pesanReminderHarian, pesanWeeklyDigest } = require('../utils/pesan');

// Simpan referensi cron tasks agar bisa di-stop
const tasks = [];

// ═══════════════════════════════════════════════
//  REMINDER HARIAN
// ═══════════════════════════════════════════════

/**
 * Kirim reminder ke semua user aktif yang belum catat transaksi hari ini.
 * @param {object} sock - Instance socket Baileys
 */
async function jalankanReminderHarian(sock) {
  console.log('⏰ Reminder harian: mulai memeriksa user...');

  try {
    const users = await getActiveUsers();
    let terkirim = 0;
    let dilewati = 0;

    for (const user of users) {
      try {
        const jumlah = await countTransaksiHariIni(user.id);

        if (jumlah > 0) {
          // Sudah ada transaksi hari ini, lewati
          dilewati++;
          continue;
        }

        // Belum ada transaksi — kirim reminder
        const webBase = process.env.WEB_URL;
        const webUrl = webBase ? `${webBase}/${user.publicId}/transaksi` : null;
        const pesan = pesanReminderHarian(user.nama, webUrl);

        await sock.sendMessage(user.nomorWa, { text: pesan });
        terkirim++;

        // Jeda kecil antar pesan agar tidak flood
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (errUser) {
        console.error(`⚠️ Reminder gagal ke ${user.nomorWa}:`, errUser.message);
      }
    }

    console.log(`✅ Reminder harian selesai: ${terkirim} terkirim, ${dilewati} dilewati`);
  } catch (error) {
    console.error('❌ Error reminder harian:', error);
  }
}

// ═══════════════════════════════════════════════
//  WEEKLY DIGEST
// ═══════════════════════════════════════════════

/**
 * Kirim weekly digest ke semua user aktif (Senin pagi).
 * @param {object} sock - Instance socket Baileys
 */
async function jalankanWeeklyDigest(sock) {
  console.log('📊 Weekly digest: mulai mengirim ringkasan mingguan...');

  try {
    const users = await getActiveUsers();
    let terkirim = 0;

    for (const user of users) {
      try {
        const data = await getWeeklyDigestData(user.id);

        const webBase = process.env.WEB_URL;
        const webUrl = webBase ? `${webBase}/${user.publicId}/laporan` : null;
        const pesan = pesanWeeklyDigest(user.nama, data, webUrl);

        await sock.sendMessage(user.nomorWa, { text: pesan });
        terkirim++;

        // Jeda kecil antar pesan
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (errUser) {
        console.error(`⚠️ Digest gagal ke ${user.nomorWa}:`, errUser.message);
      }
    }

    console.log(`✅ Weekly digest selesai: ${terkirim} terkirim`);
  } catch (error) {
    console.error('❌ Error weekly digest:', error);
  }
}

// ═══════════════════════════════════════════════
//  SETUP SCHEDULER
// ═══════════════════════════════════════════════

/**
 * Setup semua scheduled jobs.
 * @param {object} sock - Instance socket Baileys (untuk kirim pesan)
 */
function setupScheduler(sock) {
  // ── Reminder harian: setiap hari jam 20:00 WIB ──
  const reminderHarian = cron.schedule(
    '0 20 * * *',
    () => jalankanReminderHarian(sock),
    {
      scheduled: true,
      timezone: 'Asia/Jakarta',
    }
  );

  // ── Weekly digest: setiap Senin jam 08:00 WIB ──
  const weeklyDigest = cron.schedule(
    '0 8 * * 1',
    () => jalankanWeeklyDigest(sock),
    {
      scheduled: true,
      timezone: 'Asia/Jakarta',
    }
  );

  tasks.push(reminderHarian, weeklyDigest);

  console.log('⏰ Scheduler aktif:');
  console.log('   • Reminder harian  → setiap hari jam 20:00 WIB');
  console.log('   • Weekly digest    → setiap Senin jam 08:00 WIB');
}

/**
 * Hentikan semua scheduled jobs.
 */
function stopScheduler() {
  for (const task of tasks) {
    task.stop();
  }
  tasks.length = 0; // Bersihkan array agar tidak menumpuk saat reconnect
  console.log('⏰ Scheduler dihentikan');
}

module.exports = {
  setupScheduler,
  stopScheduler,
};

