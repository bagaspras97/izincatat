/**
 * Webhook Server — Izin Catat (Mode Wablas)
 * Express server yang menerima incoming message dari Wablas
 * dan meneruskannya ke handler yang sama dengan mode Baileys.
 *
 * Wablas akan POST ke: https://<domain>/webhook
 * setiap ada pesan masuk dari user.
 *
 * Payload Wablas (teks):
 * {
 *   "device"  : "6281234567890",
 *   "phone"   : "6289876543210",
 *   "message" : "catat keluar 25000 makan siang",
 *   "name"    : "Budi",
 *   "file"    : null,
 *   "isGroup" : false
 * }
 *
 * Payload Wablas (voice note / audio):
 * {
 *   "device"   : "6281234567890",
 *   "phone"    : "6289876543210",
 *   "message"  : "audio",
 *   "name"     : "Budi",
 *   "file"     : "https://cdn.wablas.com/media/xxx.ogg",
 *   "isGroup"  : false
 * }
 */

const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const { handleMessage } = require('./handlers');
const { getWablasSock } = require('./services/wa');
const { transcribeAudio } = require('./services/whisper');
const { testConnection } = require('./database/prisma');
const { setupScheduler, stopScheduler } = require('./services/scheduler');

// ═══════════════════════════════════════════════
//  UTIL: parse request body
// ═══════════════════════════════════════════════

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (parseErr) {
          console.debug('[Webhook] Body bukan JSON:', parseErr.message);
          resolve({});
        }
    });
    req.on('error', reject);
  });
}

// ═══════════════════════════════════════════════
//  UTIL: download audio dari URL
// ═══════════════════════════════════════════════

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    lib.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ═══════════════════════════════════════════════
//  WEBHOOK HANDLER
// ═══════════════════════════════════════════════

async function handleWebhook(req, res) {
  try {
    const payload = await parseBody(req);

    // Respond setelah body dibaca
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');

    const t0 = Date.now();
    console.log('[Webhook] Payload masuk:', JSON.stringify(payload));

    const { phone, message, name, file, isGroup } = payload;

    // Skip pesan grup
    if (isGroup) return;

    // Normalisasi sender ke format Baileys JID agar handler existing tetap kompatibel
    const sender = phone.replaceAll(/\D/g, '') + '@s.whatsapp.net';
    const pushName = name || null;
    const sock = getWablasSock();

    // ── Voice note / audio ──
    if (file && (message === 'audio' || message === 'voice')) {
      try {
        console.log(`🎤 Voice note dari ${pushName || phone} — transkripsi...`);

        const buffer = await downloadBuffer(file);
        const { success, text } = await transcribeAudio(buffer);

        if (!success || !text) {
          await sock.sendMessage(sender, {
            text: 'Maaf, tidak bisa mendengar pesanmu. Coba ulangi atau ketik pesannya ya.',
          });
          return;
        }

        console.log(`📝 Transkripsi: "${text}"`);
        await sock.sendMessage(sender, { text: `🎤 _Saya dengar:_ "${text}"` });
        await handleMessage(sock, sender, text, pushName);
      } catch (err) {
        console.error('[Webhook] Error memproses voice note:', err.message);
        await sock.sendMessage(sender, {
          text: 'Gagal memproses pesan suara. Coba ketik pesannya ya.',
        });
      }
      return;
    }

    // ── Pesan teks biasa ──
    if (!message || message.trim() === '') return;

    console.log(`📩 Pesan dari ${pushName || phone}: "${message}"`);
    const tHandle = Date.now();
    await handleMessage(sock, sender, message, pushName);
    const tDone = Date.now();
    console.log(`⏱️  handleMessage: ${tDone - tHandle}ms | total sejak webhook: ${tDone - t0}ms`);

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
  }
}

// ═══════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════

async function startWebhookServer() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    📝 Izin Catat — Webhook Server    ║');
  console.log('║    Provider: Wablas                   ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  // Test koneksi database
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Tidak bisa lanjut tanpa koneksi database. Periksa DATABASE_URL di .env');
    process.exit(1);
  }

  const port = process.env.WEBHOOK_PORT || 3001;

  const server = http.createServer((req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', provider: 'wablas', ts: new Date().toISOString() }));
      return;
    }

    // Webhook endpoint
    if (req.method === 'POST' && req.url === '/webhook') {
      handleWebhook(req, res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`✅ Webhook server berjalan di port ${port}`);
    console.log(`   POST http://0.0.0.0:${port}/webhook`);
    console.log(`   GET  http://0.0.0.0:${port}/health`);
    console.log('');
    console.log('⚙️  Pastikan di dashboard Wablas:');
    console.log(`   Webhook URL = http://<IP_VPS>:${port}/webhook`);
    console.log('');
  });

  // Setup scheduler dengan wablas sock
  const sock = getWablasSock();
  setupScheduler(sock);

  return server;
}

module.exports = { startWebhookServer };
