/**
 * Webhook Server — Izin Catat (Mode WhatsApp Cloud API)
 *
 * Meta akan mengirim:
 *   GET /webhook?hub.mode=subscribe&hub.challenge=XXX&hub.verify_token=TOKEN
 *     → untuk verifikasi webhook saat pertama setup
 *   POST /webhook
 *     → setiap ada pesan masuk dari user
 *
 * Payload POST (teks):
 * {
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "contacts": [{ "profile": { "name": "Budi" }, "wa_id": "628xxx" }],
 *         "messages": [{ "from": "628xxx", "type": "text", "text": { "body": "..." } }]
 *       }
 *     }]
 *   }]
 * }
 *
 * Payload POST (audio/voice note):
 * {
 *   "messages": [{ "from": "628xxx", "type": "audio", "audio": { "id": "MEDIA_ID" } }]
 * }
 *
 * Env yang dibutuhkan:
 *   WHATSAPP_TOKEN           — access token dari Meta (System User Token)
 *   WHATSAPP_PHONE_NUMBER_ID — Phone Number ID dari Meta for Developers
 *   WEBHOOK_VERIFY_TOKEN     — token bebas isi, samakan di dashboard Meta
 *   WEBHOOK_PORT             — port server (default 3001)
 */

const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const { handleMessage } = require('./handlers');
const { getCloudApiSock } = require('./services/wa');
const { transcribeAudio } = require('./services/whisper');
const { testConnection } = require('./database/prisma');
const { setupScheduler } = require('./services/scheduler');

// Persistent agent untuk download media
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 5 });

// ═══════════════════════════════════════════════
//  UTIL: parse request body
// ═══════════════════════════════════════════════

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ═══════════════════════════════════════════════
//  UTIL: download media dari Cloud API
// ═══════════════════════════════════════════════

/**
 * Download audio/media dari Cloud API.
 * Cloud API tidak langsung memberi URL — perlu 2 langkah:
 *   1. GET /v18.0/{mediaId} → dapatkan URL download
 *   2. Download dari URL tersebut dengan header Authorization
 */
async function downloadCloudApiMedia(mediaId) {
  const token = process.env.WHATSAPP_TOKEN;

  // Step 1: ambil URL media
  const meta = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v18.0/${mediaId}`,
      method: 'GET',
      agent: httpsAgent,
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    req.end();
  });

  if (!meta.url) throw new Error('Tidak dapat URL media: ' + JSON.stringify(meta));

  // Step 2: download dari URL dengan Bearer token
  const chunks = await new Promise((resolve, reject) => {
    const parsed = new URL(meta.url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      agent: httpsAgent,
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      const parts = [];
      res.on('data', (c) => parts.push(c));
      res.on('end', () => resolve(parts));
    });
    req.on('error', reject);
    req.end();
  });

  return Buffer.concat(chunks);
}

// ═══════════════════════════════════════════════
//  WEBHOOK HANDLER
// ═══════════════════════════════════════════════

async function handleWebhook(req, res) {
  try {
    const payload = await parseBody(req);

    // Balas 200 segera agar Meta tidak retry
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');

    const t0 = Date.now();
    const sock = getCloudApiSock();

    for (const entry of (payload.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value?.messages;
        if (!messages?.length) continue;

        // Nama pengirim dari contacts array
        const contact = value?.contacts?.[0];
        const pushName = contact?.profile?.name || null;

        for (const msg of messages) {
          const phone = msg.from; // format: "628xxx"
          const sender = phone + '@s.whatsapp.net';

          if (msg.type === 'text') {
            const text = msg.text?.body?.trim();
            if (!text) continue;

            console.log(`📩 Pesan dari ${pushName || phone}: "${text}"`);
            const tHandle = Date.now();
            await handleMessage(sock, sender, text, pushName);
            console.log(`⏱️  handleMessage: ${Date.now() - tHandle}ms | total: ${Date.now() - t0}ms`);

          } else if (msg.type === 'audio') {
            const mediaId = msg.audio?.id;
            if (!mediaId) continue;

            try {
              console.log(`🎤 Voice note dari ${pushName || phone} — transkripsi...`);
              const buffer = await downloadCloudApiMedia(mediaId);
              const { success, text } = await transcribeAudio(buffer);

              if (!success || !text) {
                await sock.sendMessage(sender, {
                  text: 'Maaf, tidak bisa mendengar pesanmu. Coba ulangi atau ketik pesannya ya.',
                });
                continue;
              }

              console.log(`📝 Transkripsi: "${text}"`);
              await sock.sendMessage(sender, { text: `🎤 _Saya dengar:_ "${text}"` });
              await handleMessage(sock, sender, text, pushName);
            } catch (err) {
              console.error('[CloudAPI] Error voice note:', err.message);
              await sock.sendMessage(sender, {
                text: 'Gagal memproses pesan suara. Coba ketik pesannya ya.',
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[CloudAPI] Error handleWebhook:', err.message);
  }
}

// ═══════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════

async function startCloudApiServer() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    📝 Izin Catat — Webhook Server        ║');
  console.log('║    Provider: WhatsApp Cloud API (Meta)   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Validasi env wajib
  if (!process.env.WHATSAPP_TOKEN) {
    console.error('❌ WHATSAPP_TOKEN belum di-set di .env');
    process.exit(1);
  }
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error('❌ WHATSAPP_PHONE_NUMBER_ID belum di-set di .env');
    process.exit(1);
  }
  if (!process.env.WEBHOOK_VERIFY_TOKEN) {
    console.error('❌ WEBHOOK_VERIFY_TOKEN belum di-set di .env');
    process.exit(1);
  }

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Tidak bisa lanjut tanpa koneksi database. Periksa DATABASE_URL di .env');
    process.exit(1);
  }

  const port = process.env.WEBHOOK_PORT || 3001;
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  const server = http.createServer((req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', provider: 'cloudapi', ts: new Date().toISOString() }));
      return;
    }

    // Webhook verification — Meta kirim GET untuk verifikasi saat pertama setup
    if (req.method === 'GET' && req.url?.startsWith('/webhook')) {
      const url = new URL(req.url, `http://localhost`);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[CloudAPI] ✅ Webhook berhasil diverifikasi Meta');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        return;
      }

      console.warn('[CloudAPI] ⚠️ Verifikasi webhook gagal — token tidak cocok');
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // Incoming messages
    if (req.method === 'POST' && req.url === '/webhook') {
      handleWebhook(req, res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`✅ Webhook server berjalan di port ${port}`);
    console.log(`   POST https://<domain>/webhook`);
    console.log(`   GET  http://0.0.0.0:${port}/health`);
    console.log('');
    console.log('⚙️  Setup di Meta for Developers (developers.facebook.com):');
    console.log(`   1. App → WhatsApp → Configuration → Webhook URL`);
    console.log(`      = https://<domain_publik>/webhook`);
    console.log(`   2. Verify Token = nilai WEBHOOK_VERIFY_TOKEN di .env`);
    console.log(`   3. Subscribe ke field: messages`);
    console.log('');
  });

  const sock = getCloudApiSock();
  setupScheduler(sock);

  return server;
}

module.exports = { startCloudApiServer };
