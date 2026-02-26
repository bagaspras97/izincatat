/**
 * Scheduler Service — Izin Catat
 * Pengaturan job scheduler menggunakan node-cron.
 * Fase 1: Struktur dasar, reminder disiapkan untuk fase berikutnya.
 */

const cron = require('node-cron');

// Simpan referensi cron tasks agar bisa di-stop
const tasks = [];

/**
 * Setup semua scheduled jobs.
 * @param {object} sock - Instance socket Baileys (untuk kirim pesan)
 */
function setupScheduler(sock) {
  // Reminder harian jam 20:00 WIB (13:00 UTC)
  // Fase 2: implementasi pengiriman reminder ke semua user aktif
  const reminderHarian = cron.schedule(
    '0 20 * * *', // Setiap hari jam 20:00
    async () => {
      console.log('⏰ Reminder harian dijalankan');
      // Di fase selanjutnya, kirim pesan ke semua user aktif
      // untuk mengingatkan mencatat pengeluaran hari ini
    },
    {
      scheduled: true,
      timezone: 'Asia/Jakarta',
    }
  );

  tasks.push(reminderHarian);
  console.log('⏰ Scheduler berhasil dijalankan');
}

/**
 * Hentikan semua scheduled jobs.
 */
function stopScheduler() {
  for (const task of tasks) {
    task.stop();
  }
  console.log('⏰ Scheduler dihentikan');
}

module.exports = {
  setupScheduler,
  stopScheduler,
};
