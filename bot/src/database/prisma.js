/**
 * Prisma Client — Izin Catat
 * Singleton instance Prisma Client untuk koneksi database.
 */

const { PrismaClient } = require('@prisma/client');

// Buat singleton agar tidak banyak koneksi terbuka
const prisma = new PrismaClient({
  log: process.env.DEBUG === 'true'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

/**
 * Test koneksi database
 */
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database PostgreSQL terhubung');
    return true;
  } catch (error) {
    console.error('❌ Gagal konek ke database:', error.message);
    return false;
  }
}

/**
 * Tutup koneksi database dengan aman
 */
async function disconnect() {
  await prisma.$disconnect();
  console.log('🔌 Koneksi database ditutup');
}

module.exports = {
  prisma,
  testConnection,
  disconnect,
};
