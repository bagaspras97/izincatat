/**
 * Database Queries — Izin Catat
 * Semua operasi CRUD ke database dikelola di sini.
 * Memisahkan logic database dari handler bot.
 */

const { prisma } = require('./prisma');
const { encrypt, decrypt, decryptTransaksi, decryptTransaksiList } = require('../utils/crypto');
const { createId } = require('@paralleldrive/cuid2');

// ═══════════════════════════════════════════════
//  USER QUERIES
// ═══════════════════════════════════════════════

/**
 * Ambil user berdasarkan nomor WA, buat baru jika belum ada.
 * @param {string} nomorWa - Nomor WhatsApp (format: 628xxx@s.whatsapp.net)
 * @param {string|null} nama - Nama push/profile user
 * @returns {{ user: object, isNew: boolean }}
 */
async function getOrCreateUser(nomorWa, nama = null) {
  try {
    // Cari user existing
    let user = await prisma.user.findUnique({
      where: { nomorWa },
    });

    if (user) {
      // Update nama jika berubah
      if (nama && user.nama !== nama) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { nama },
        });
      }
      return { user, isNew: false };
    }

    // Buat user baru dengan publicId CUID2
    user = await prisma.user.create({
      data: { nomorWa, nama, publicId: createId() },
    });

    console.log(`👤 User baru terdaftar: ${nama || nomorWa}`);
    return { user, isNew: true };
  } catch (error) {
    console.error('Error getOrCreateUser:', error);
    throw error;
  }
}

/**
 * Ambil user berdasarkan nomor WA.
 * @param {string} nomorWa
 * @returns {object|null}
 */
async function getUserByNomorWa(nomorWa) {
  return prisma.user.findUnique({ where: { nomorWa } });
}

// ═══════════════════════════════════════════════
//  TRANSAKSI QUERIES
// ═══════════════════════════════════════════════

/**
 * Simpan transaksi baru ke database.
 * @param {object} data - { userId, jenis, nominal, keterangan, kategori }
 * @returns {object} Transaksi yang tersimpan
 */
async function simpanTransaksi({ userId, jenis, nominal, keterangan, kategori }) {
  try {
    const transaksi = await prisma.transaksi.create({
      data: {
        userId,
        jenis,
        nominal,
        keterangan: encrypt(keterangan),
        kategori,
      },
    });

    console.log(`📝 Transaksi disimpan: #${transaksi.id} ${jenis} ${nominal} - ${keterangan}`);
    return decryptTransaksi(transaksi);
  } catch (error) {
    console.error('Error simpanTransaksi:', error);
    throw error;
  }
}

/**
 * Ambil satu transaksi berdasarkan ID dan userId (keamanan).
 * @param {number} transaksiId
 * @param {number} userId
 * @returns {object|null}
 */
async function getTransaksiById(transaksiId, userId) {
  const trx = await prisma.transaksi.findFirst({
    where: {
      id: transaksiId,
      userId,
    },
  });
  return decryptTransaksi(trx);
}

/**
 * Hapus transaksi berdasarkan ID, hanya jika milik user.
 * @param {number} transaksiId
 * @param {number} userId
 * @returns {boolean} true jika berhasil dihapus
 */
async function hapusTransaksi(transaksiId, userId) {
  try {
    const trx = await prisma.transaksi.findFirst({
      where: { id: transaksiId, userId },
    });

    if (!trx) return false;

    await prisma.transaksi.delete({ where: { id: transaksiId } });
    console.log(`🗑️ Transaksi dihapus: #${transaksiId} oleh userId=${userId}`);
    return true;
  } catch (error) {
    console.error('Error hapusTransaksi:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════
//  SALDO QUERIES
// ═══════════════════════════════════════════════

/**
 * Hitung total nominal berdasarkan jenis dan rentang waktu.
 * @param {number} userId
 * @param {string} jenis - "masuk" atau "keluar"
 * @param {Date} mulai
 * @param {Date} selesai
 * @returns {number}
 */
async function hitungTotal(userId, jenis, mulai, selesai) {
  const result = await prisma.transaksi.aggregate({
    where: {
      userId,
      jenis,
      tanggal: { gte: mulai, lt: selesai },
    },
    _sum: { nominal: true },
  });

  return Number.parseFloat(result._sum.nominal) || 0;
}

/**
 * Ambil saldo hari ini (pemasukan, pengeluaran, saldo bersih).
 * @param {number} userId
 * @returns {{ pemasukan: number, pengeluaran: number, saldo: number }}
 */
async function getSaldoHariIni(userId) {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  const [pemasukan, pengeluaran] = await Promise.all([
    hitungTotal(userId, 'masuk', mulai, selesai),
    hitungTotal(userId, 'keluar', mulai, selesai),
  ]);

  return {
    pemasukan,
    pengeluaran,
    saldo: pemasukan - pengeluaran,
  };
}

/**
 * Ambil saldo bulan ini.
 * @param {number} userId
 * @returns {{ pemasukan: number, pengeluaran: number, saldo: number }}
 */
async function getSaldoBulanIni(userId) {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const selesai = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);

  const [pemasukan, pengeluaran] = await Promise.all([
    hitungTotal(userId, 'masuk', mulai, selesai),
    hitungTotal(userId, 'keluar', mulai, selesai),
  ]);

  return {
    pemasukan,
    pengeluaran,
    saldo: pemasukan - pengeluaran,
  };
}

// ═══════════════════════════════════════════════
//  LAPORAN QUERIES
// ═══════════════════════════════════════════════

/**
 * Ambil data laporan berdasarkan periode.
 * @param {number} userId
 * @param {string} periode - "hari", "minggu", "bulan"
 * @returns {object} Data laporan lengkap
 */
async function getLaporan(userId, periode) {
  const now = new Date();
  // Default: hari ini
  let mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  let selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  let labelPeriode = 'Hari Ini';

  if (periode === 'minggu') {
    mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    labelPeriode = '7 Hari Terakhir';
  } else if (periode === 'bulan') {
    mulai = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    selesai = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    labelPeriode = 'Bulan Ini';
  }

  // Semua queries dijalankan paralel
  const [totalMasuk, totalKeluar, breakdownRaw, transaksiTerakhirRaw] = await Promise.all([
    hitungTotal(userId, 'masuk', mulai, selesai),
    hitungTotal(userId, 'keluar', mulai, selesai),
    prisma.transaksi.groupBy({
      by: ['kategori'],
      where: {
        userId,
        jenis: 'keluar',
        tanggal: { gte: mulai, lt: selesai },
      },
      _sum: { nominal: true },
      orderBy: { _sum: { nominal: 'desc' } },
    }),
    prisma.transaksi.findMany({
      where: {
        userId,
        tanggal: { gte: mulai, lt: selesai },
      },
      orderBy: { tanggal: 'desc' },
      take: 5,
    }),
  ]);

  const breakdown = breakdownRaw.map((item) => ({
    kategori: item.kategori,
    total: Number.parseFloat(item._sum.nominal) || 0,
  }));

  return {
    labelPeriode,
    totalMasuk,
    totalKeluar,
    saldo: totalMasuk - totalKeluar,
    breakdown,
    transaksiTerakhir: decryptTransaksiList(transaksiTerakhirRaw),
  };
}

// ═══════════════════════════════════════════════
//  RIWAYAT QUERIES
// ═══════════════════════════════════════════════

/**
 * Ambil riwayat transaksi dengan limit.
 * @param {number} userId
 * @param {number} limit - Jumlah transaksi yang diambil
 * @returns {{ transaksi: object[], total: number }}
 */
async function getRiwayat(userId, limit = 10) {
  const [transaksiRaw, total] = await Promise.all([
    prisma.transaksi.findMany({
      where: { userId },
      orderBy: { tanggal: 'desc' },
      take: limit,
    }),
    prisma.transaksi.count({
      where: { userId },
    }),
  ]);

  return { transaksi: decryptTransaksiList(transaksiRaw), total };
}

// ═══════════════════════════════════════════════
//  SCHEDULER QUERIES
// ═══════════════════════════════════════════════

/**
 * Ambil semua user aktif (untuk scheduler).
 * @returns {Array<{ id, nomorWa, nama, publicId, tier, tierExpiry }>}
 */
async function getActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, nomorWa: true, nama: true, publicId: true, tier: true, tierExpiry: true },
  });
}

/**
 * Hitung jumlah transaksi user hari ini.
 * @param {number} userId
 * @returns {number}
 */
async function countTransaksiHariIni(userId) {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return prisma.transaksi.count({
    where: { userId, tanggal: { gte: mulai, lt: selesai } },
  });
}

/**
 * Ambil Set userId yang sudah mencatat transaksi hari ini (bulk, 1 query).
 * Digunakan scheduler agar tidak N+1 query per user.
 * @returns {Set<number>}
 */
async function getUserIdsWithTransaksiHariIni() {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const selesai = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const rows = await prisma.transaksi.findMany({
    where: { tanggal: { gte: mulai, lt: selesai } },
    select: { userId: true },
    distinct: ['userId'],
  });
  return new Set(rows.map((r) => r.userId));
}

/**
 * Ambil data weekly digest untuk semua userId sekaligus (bulk, 5 queries).
 * Menggantikan getWeeklyDigestData yang dipanggil N-kali per user.
 * @param {number[]} userIds
 * @returns {Map<number, { mingguLalu: object, mingguSebelumnya: object }>}
 */
async function getAllWeeklyDigestData(userIds) {
  if (userIds.length === 0) return new Map();

  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startLastWeek = new Date(endDate);
  startLastWeek.setDate(startLastWeek.getDate() - 7);
  const startPrevWeek = new Date(startLastWeek);
  startPrevWeek.setDate(startPrevWeek.getDate() - 7);

  const [
    masukLaluRows,
    keluarLaluRows,
    masukSebelumRows,
    keluarSebelumRows,
    countRows,
    breakdownRows,
  ] = await Promise.all([
    prisma.transaksi.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, jenis: 'masuk', tanggal: { gte: startLastWeek, lt: endDate } },
      _sum: { nominal: true },
    }),
    prisma.transaksi.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, jenis: 'keluar', tanggal: { gte: startLastWeek, lt: endDate } },
      _sum: { nominal: true },
    }),
    prisma.transaksi.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, jenis: 'masuk', tanggal: { gte: startPrevWeek, lt: startLastWeek } },
      _sum: { nominal: true },
    }),
    prisma.transaksi.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, jenis: 'keluar', tanggal: { gte: startPrevWeek, lt: startLastWeek } },
      _sum: { nominal: true },
    }),
    prisma.transaksi.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, tanggal: { gte: startLastWeek, lt: endDate } },
      _count: { id: true },
    }),
    prisma.transaksi.groupBy({
      by: ['userId', 'kategori'],
      where: { userId: { in: userIds }, jenis: 'keluar', tanggal: { gte: startLastWeek, lt: endDate } },
      _sum: { nominal: true },
    }),
  ]);

  // Build lookup maps
  const toSumMap = (rows) => {
    const m = new Map();
    for (const r of rows) m.set(r.userId, parseFloat(r._sum?.nominal) || 0);
    return m;
  };
  const masukLaluMap   = toSumMap(masukLaluRows);
  const keluarLaluMap  = toSumMap(keluarLaluRows);
  const masukSebelumMap  = toSumMap(masukSebelumRows);
  const keluarSebelumMap = toSumMap(keluarSebelumRows);

  const countMap = new Map();
  for (const r of countRows) countMap.set(r.userId, r._count?.id || 0);

  // Group breakdown per userId, urutkan, ambil top 3
  const breakdownMap = new Map();
  for (const r of breakdownRows) {
    if (!breakdownMap.has(r.userId)) breakdownMap.set(r.userId, []);
    breakdownMap.get(r.userId).push({
      kategori: r.kategori,
      total: parseFloat(r._sum?.nominal) || 0,
    });
  }
  for (const [uid, arr] of breakdownMap) {
    arr.sort((a, b) => b.total - a.total);
    breakdownMap.set(uid, arr.slice(0, 3));
  }

  // Rakit Map hasil akhir
  const result = new Map();
  for (const userId of userIds) {
    const masukLalu   = masukLaluMap.get(userId)   ?? 0;
    const keluarLalu  = keluarLaluMap.get(userId)  ?? 0;
    const masukSebelum  = masukSebelumMap.get(userId)  ?? 0;
    const keluarSebelum = keluarSebelumMap.get(userId) ?? 0;
    result.set(userId, {
      mingguLalu: {
        mulai: startLastWeek,
        selesai: endDate,
        totalMasuk: masukLalu,
        totalKeluar: keluarLalu,
        saldo: masukLalu - keluarLalu,
        jumlahTransaksi: countMap.get(userId) ?? 0,
        topKategori: breakdownMap.get(userId) ?? [],
      },
      mingguSebelumnya: {
        totalMasuk: masukSebelum,
        totalKeluar: keluarSebelum,
        saldo: masukSebelum - keluarSebelum,
      },
    });
  }
  return result;
}

/**
 * Ambil data weekly digest: minggu lalu vs dua minggu lalu.
 * Dirancang untuk dipanggil Senin pagi — "minggu lalu" = 7 hari sebelum hari ini.
 * @param {number} userId
 * @returns {{ mingguLalu: object, mingguSebelumnya: object }}
 */
async function getWeeklyDigestData(userId) {
  const now = new Date();

  // Minggu lalu: Senin lalu 00:00 → hari ini 00:00 (7 hari penuh)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startLastWeek = new Date(endDate);
  startLastWeek.setDate(startLastWeek.getDate() - 7);

  // Dua minggu lalu (untuk perbandingan)
  const startPrevWeek = new Date(startLastWeek);
  startPrevWeek.setDate(startPrevWeek.getDate() - 7);

  // Ambil semua data dua periode sekaligus
  const [
    masukMingguLalu,
    keluarMingguLalu,
    masukMingguSebelumnya,
    keluarMingguSebelumnya,
    jumlahTransaksiMingguLalu,
    breakdownRaw,
  ] = await Promise.all([
    hitungTotal(userId, 'masuk', startLastWeek, endDate),
    hitungTotal(userId, 'keluar', startLastWeek, endDate),
    hitungTotal(userId, 'masuk', startPrevWeek, startLastWeek),
    hitungTotal(userId, 'keluar', startPrevWeek, startLastWeek),
    prisma.transaksi.count({
      where: { userId, tanggal: { gte: startLastWeek, lt: endDate } },
    }),
    prisma.transaksi.groupBy({
      by: ['kategori'],
      where: { userId, jenis: 'keluar', tanggal: { gte: startLastWeek, lt: endDate } },
      _sum: { nominal: true },
      orderBy: { _sum: { nominal: 'desc' } },
      take: 3,
    }),
  ]);

  const topKategori = breakdownRaw.map((item) => ({
    kategori: item.kategori,
    total: Number.parseFloat(item._sum.nominal) || 0,
  }));

  return {
    mingguLalu: {
      mulai: startLastWeek,
      selesai: endDate,
      totalMasuk: masukMingguLalu,
      totalKeluar: keluarMingguLalu,
      saldo: masukMingguLalu - keluarMingguLalu,
      jumlahTransaksi: jumlahTransaksiMingguLalu,
      topKategori,
    },
    mingguSebelumnya: {
      totalMasuk: masukMingguSebelumnya,
      totalKeluar: keluarMingguSebelumnya,
      saldo: masukMingguSebelumnya - keluarMingguSebelumnya,
    },
  };
}

// ═══════════════════════════════════════════════
//  BILLING QUERIES
// ═══════════════════════════════════════════════

const TIER_LIMIT = {
  GRATIS: 50,
  PRO: Infinity,
  COUPLE: Infinity,
};

/**
 * Hitung jumlah transaksi user di bulan berjalan.
 * @param {number} userId
 * @returns {number}
 */
async function countTransaksiBulanIni(userId) {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const selesai = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return prisma.transaksi.count({
    where: { userId, tanggal: { gte: mulai, lt: selesai } },
  });
}

/**
 * Cek apakah user masih boleh mencatat transaksi baru.
 * @param {object} user - Data user dari database
 * @returns {{ allowed: boolean, used: number, limit: number, tier: string }}
 */
async function checkBillingLimit(user) {
  // Tentukan tier aktif — expire ke GRATIS jika tierExpiry sudah lewat
  let tier = user.tier || 'GRATIS';
  if (tier !== 'GRATIS' && user.tierExpiry && new Date() > new Date(user.tierExpiry)) {
    tier = 'GRATIS';
    // Downgrade otomatis di database (fire and forget)
    prisma.user.update({ where: { id: user.id }, data: { tier: 'GRATIS', tierExpiry: null } }).catch(() => {});
  }

  const limit = TIER_LIMIT[tier] ?? TIER_LIMIT.GRATIS;
  if (limit === Infinity) return { allowed: true, used: 0, limit, tier };

  const used = await countTransaksiBulanIni(user.id); // NOSONAR
  return { allowed: used < limit, used, limit, tier };
}

/**
 * Upgrade tier user (dipakai admin/manual).
 * @param {string} nomorWa
 * @param {'PRO'|'COUPLE'} tier
 * @param {Date} expiry
 */
async function upgradeTier(nomorWa, tier, expiry) {
  return prisma.user.update({
    where: { nomorWa },
    data: { tier, tierExpiry: expiry },
  });
}

module.exports = {
  getOrCreateUser,
  getUserByNomorWa,
  simpanTransaksi,
  getTransaksiById,
  hapusTransaksi,
  getSaldoHariIni,
  getSaldoBulanIni,
  getLaporan,
  getRiwayat,
  getActiveUsers,
  countTransaksiHariIni,
  getUserIdsWithTransaksiHariIni,
  getWeeklyDigestData,
  getAllWeeklyDigestData,
  countTransaksiBulanIni,
  checkBillingLimit,
  upgradeTier,
  TIER_LIMIT,
};
