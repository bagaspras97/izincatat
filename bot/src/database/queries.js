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

  const pemasukan = await hitungTotal(userId, 'masuk', mulai, selesai); // NOSONAR
  const pengeluaran = await hitungTotal(userId, 'keluar', mulai, selesai); // NOSONAR

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

  const pemasukan = await hitungTotal(userId, 'masuk', mulai, selesai); // NOSONAR
  const pengeluaran = await hitungTotal(userId, 'keluar', mulai, selesai); // NOSONAR

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

  // Total pemasukan & pengeluaran
  const totalMasuk = await hitungTotal(userId, 'masuk', mulai, selesai); // NOSONAR
  const totalKeluar = await hitungTotal(userId, 'keluar', mulai, selesai); // NOSONAR

  // Breakdown pengeluaran per kategori
  const breakdownRaw = await prisma.transaksi.groupBy({
    by: ['kategori'],
    where: {
      userId,
      jenis: 'keluar',
      tanggal: { gte: mulai, lt: selesai },
    },
    _sum: { nominal: true },
    orderBy: { _sum: { nominal: 'desc' } },
  });

  const breakdown = breakdownRaw.map((item) => ({
    kategori: item.kategori,
    total: Number.parseFloat(item._sum.nominal) || 0,
  }));

  // 5 transaksi terakhir dalam periode
  const transaksiTerakhirRaw = await prisma.transaksi.findMany({
    where: {
      userId,
      tanggal: { gte: mulai, lt: selesai },
    },
    orderBy: { tanggal: 'desc' },
    take: 5,
  });

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
 * @returns {Array<{ id, nomorWa, nama, publicId }>}
 */
async function getActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, nomorWa: true, nama: true, publicId: true },
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
  getWeeklyDigestData,
};
