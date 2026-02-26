/**
 * Migration Script — Enkripsi Data Existing
 * Izin Catat
 *
 * Script ini mengenkripsi semua field `keterangan` yang masih plaintext di DB.
 * Jalankan SATU KALI setelah set ENCRYPTION_KEY di .env.
 *
 * Usage:
 *   cd bot
 *   node scripts/migrate-encrypt.js
 *
 * PENTING:
 * - Backup DB sebelum menjalankan script ini!
 * - Pastikan ENCRYPTION_KEY sudah di-set di .env
 * - Script ini idempotent: data yang sudah dienkripsi tidak akan dienkripsi lagi
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../src/utils/crypto');

const prisma = new PrismaClient();

/**
 * Cek apakah string sudah dalam format enkripsi kita (<iv>:<tag>:<cipher>)
 */
function isEncrypted(text) {
  if (!text) return true;
  const parts = text.split(':');
  return parts.length === 3 && /^[0-9a-f]+$/i.test(parts[0]) && parts[0].length === 24; // 12 byte IV = 24 hex chars
}

async function main() {
  console.log('🔐 Memulai migrasi enkripsi keterangan transaksi...\n');

  // Ambil semua transaksi
  const semua = await prisma.transaksi.findMany({
    select: { id: true, keterangan: true },
  });

  console.log(`📊 Total transaksi ditemukan: ${semua.length}`);

  const belumEnkripsi = semua.filter((t) => !isEncrypted(t.keterangan));
  const sudahEnkripsi = semua.length - belumEnkripsi.length;

  console.log(`✅ Sudah dienkripsi: ${sudahEnkripsi}`);
  console.log(`⏳ Perlu dienkripsi: ${belumEnkripsi.length}\n`);

  if (belumEnkripsi.length === 0) {
    console.log('Semua data sudah dienkripsi. Tidak ada yang perlu dilakukan.');
    return;
  }

  let berhasil = 0;
  let gagal = 0;

  for (const t of belumEnkripsi) {
    try {
      const keteranganEnkripsi = encrypt(t.keterangan);
      await prisma.transaksi.update({
        where: { id: t.id },
        data: { keterangan: keteranganEnkripsi },
      });
      berhasil++;

      if (berhasil % 10 === 0) {
        process.stdout.write(`\r⏳ Progress: ${berhasil}/${belumEnkripsi.length}`);
      }
    } catch (err) {
      gagal++;
      console.error(`\n❌ Gagal enkripsi transaksi #${t.id}:`, err.message);
    }
  }

  console.log(`\n\n✅ Migrasi selesai!`);
  console.log(`   Berhasil: ${berhasil}`);
  if (gagal > 0) console.log(`   Gagal   : ${gagal}`);
  console.log('\nSekarang semua keterangan transaksi sudah dienkripsi di database.');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
