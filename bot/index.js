/**
 * Index — Izin Catat
 * Entry point utama aplikasi.
 * Jalankan dengan: node index.js
 */

// Load environment variables
require('dotenv').config();

const { startBot } = require('./src/bot');
const { disconnect } = require('./src/database/prisma');
const { stopScheduler } = require('./src/services/scheduler');

// ═══════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════

async function main() {
  try {
    console.log('🚀 Memulai Izin Catat Bot...');
    console.log(`📅 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    console.log(`🔧 Mode: ${process.env.DEBUG === 'true' ? 'DEBUG' : 'PRODUCTION'}`);
    console.log('');

    // Jalankan bot
    await startBot();
  } catch (error) {
    console.error('❌ Fatal error saat memulai bot:', error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════

async function shutdown(signal) {
  console.log(`\n🛑 Menerima sinyal ${signal}. Mematikan bot dengan aman...`);

  try {
    stopScheduler();
    await disconnect();
    console.log('👋 Izin Catat Bot berhenti. Sampai jumpa!');
  } catch (error) {
    console.error('Error saat shutdown:', error);
  }

  process.exit(0);
}

// Handle sinyal shutdown
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors agar bot tidak crash
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

// Jalankan!
main(); // NOSONAR - CommonJS tidak mendukung top-level await
