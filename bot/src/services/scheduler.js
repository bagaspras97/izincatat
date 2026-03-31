/**
 * Scheduler Service — Izin Catat
 * Pengaturan job scheduler menggunakan node-cron.
 * - Reminder harian jam 20:00 WIB → kirim ke user yang belum catat hari ini
 * - Weekly digest Senin jam 08:00 WIB → ringkasan minggu lalu + perbandingan
 */

const cron = require('node-cron');
const { getActiveUsers, getUserIdsWithTransaksiHariIni, getAllWeeklyDigestData } = require('../database/queries');
const { pesanReminderHarian, pesanWeeklyDigest } = require('../utils/pesan');
const { prisma } = require('../database/prisma');

// Simpan referensi cron tasks agar bisa di-stop
const tasks = [];

// ═══════════════════════════════════════════════
//  RATE LIMIT CONSTANTS
// ═══════════════════════════════════════════════

const DELAY_ANTAR_PESAN_MS = 3000;  // minimum jeda antar pesan (ms)
const DELAY_JITTER_MS      = 2000;  // tambahan random agar pola tidak terdeteksi (0–2000ms)
const BATCH_SIZE           = 10;    // setiap N pesan ambil jeda panjang
const DELAY_BATCH_MS       = 30_000; // jeda panjang antar batch (ms)

/** Jeda acak antara DELAY_ANTAR_PESAN_MS dan DELAY_ANTAR_PESAN_MS + DELAY_JITTER_MS */
function jedaAntarPesan() {
  return new Promise((resolve) =>
    setTimeout(resolve, DELAY_ANTAR_PESAN_MS + Math.random() * DELAY_JITTER_MS)
  );
}

/** Jeda panjang antar batch */
function jedaBatch() {
  return new Promise((resolve) => setTimeout(resolve, DELAY_BATCH_MS));
}

// ═══════════════════════════════════════════════
//  TIER HELPERS
// ═══════════════════════════════════════════════

/** Kembalikan tier efektif user setelah cek expiry */
function tierEfektif(user) {
  const tier = user.tier || 'GRATIS';
  if (tier !== 'GRATIS' && user.tierExpiry && new Date() > new Date(user.tierExpiry)) {
    return 'GRATIS';
  }
  return tier;
}

// ═══════════════════════════════════════════════
//  REMINDER HARIAN
// ═══════════════════════════════════════════════

/**
 * Kirim reminder ke semua user aktif yang belum catat transaksi hari ini.
 * Menggunakan 1 bulk query untuk filter user, bukan N+1 per user.
 * Rate limit: 3–5 detik jitter antar pesan, jeda batch tiap 10 pesan.
 * @param {object} sock - Instance socket Baileys
 */
async function jalankanReminderHarian(sock) {
  console.log('⏰ Reminder harian: mulai memeriksa user...');

  try {
    // Ambil semua user aktif dan Set userId yang sudah catat hari ini sekaligus
    const [allUsers, sudahCatatIds] = await Promise.all([
      getActiveUsers(),
      getUserIdsWithTransaksiHariIni(),
    ]);

    // Reminder hanya untuk PRO dan COUPLE
    const users = allUsers.filter((u) => ['PRO', 'COUPLE'].includes(tierEfektif(u)));

    const usersBelumCatat = users.filter((u) => !sudahCatatIds.has(u.id));
    const dilewati = users.length - usersBelumCatat.length;
    let terkirim = 0;

    console.log(`   Eligible (PRO/COUPLE): ${users.length}, belum catat: ${usersBelumCatat.length}, sudah catat: ${dilewati}`);

    for (let i = 0; i < usersBelumCatat.length; i++) {
      const user = usersBelumCatat[i];
      try {
        const webBase = process.env.WEB_URL;
        const webUrl = webBase ? `${webBase}/${user.publicId}/transaksi` : null;
        const pesan = pesanReminderHarian(user.nama, webUrl);

        await sock.sendMessage(user.nomorWa, { text: pesan });
        terkirim++;

        // Jeda batch setiap BATCH_SIZE pesan (kecuali pesan terakhir)
        if (i < usersBelumCatat.length - 1) {
          if (terkirim % BATCH_SIZE === 0) {
            console.log(`⏸ Jeda batch ${DELAY_BATCH_MS / 1000}s setelah ${terkirim} pesan...`);
            await jedaBatch();
          } else {
            await jedaAntarPesan();
          }
        }
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
 * Semua data DB di-fetch sekaligus (bulk), lalu pesan dikirim serial dengan rate limit.
 * @param {object} sock - Instance socket Baileys
 */
async function jalankanWeeklyDigest(sock) {
  console.log('📊 Weekly digest: mulai mengirim ringkasan mingguan...');

  try {
    const allUsers = await getActiveUsers();

    // Weekly digest hanya untuk COUPLE
    const users = allUsers.filter((u) => tierEfektif(u) === 'COUPLE');

    if (users.length === 0) {
      console.log('ℹ️ Tidak ada user COUPLE aktif, digest dilewati.');
      return;
    }

    // Fetch semua data digest sekaligus (5 query untuk semua user, bukan 6×N)
    const userIds = users.map((u) => u.id);
    const digestMap = await getAllWeeklyDigestData(userIds);

    let terkirim = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        const data = digestMap.get(user.id);
        if (!data) continue;

        const webBase = process.env.WEB_URL;
        const webUrl = webBase ? `${webBase}/${user.publicId}/laporan` : null;
        const pesan = pesanWeeklyDigest(user.nama, data, webUrl);

        await sock.sendMessage(user.nomorWa, { text: pesan });
        terkirim++;

        if (i < users.length - 1) {
          if (terkirim % BATCH_SIZE === 0) {
            console.log(`⏸ Jeda batch ${DELAY_BATCH_MS / 1000}s setelah ${terkirim} pesan...`);
            await jedaBatch();
          } else {
            await jedaAntarPesan();
          }
        }
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

  // ── Keep-alive ping: setiap 4 menit agar Supabase tidak sleep ──
  const keepAlive = cron.schedule('*/4 * * * *', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (_) {
      // Abaikan error, ini hanya ping
    }
  });

  tasks.push(reminderHarian, weeklyDigest, keepAlive);

  console.log('⏰ Scheduler aktif:');
  console.log('   • Reminder harian  → setiap hari jam 20:00 WIB');
  console.log('   • Weekly digest    → setiap Senin jam 08:00 WIB');
  console.log('   • Keep-alive DB    → setiap 4 menit');
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

