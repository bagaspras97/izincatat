/**
 * Bot WhatsApp — Izin Catat
 * Inisialisasi koneksi Baileys, handle events, dan routing pesan.
 */

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

const { handleMessage } = require('./handlers');
const { testConnection } = require('./database/prisma');
const { setupScheduler, stopScheduler } = require('./services/scheduler');
const { transcribeAudio } = require('./services/whisper');
const { createSock } = require('./services/wa');

// Logger Baileys — level info supaya tidak terlalu verbose
const logger = pino({ level: 'silent' });

// Path penyimpanan session
const AUTH_FOLDER = './auth_info_baileys';

/**
 * Mulai bot WhatsApp.
 * - Koneksikan ke WhatsApp via QR code
 * - Handle reconnect otomatis
 * - Listen pesan masuk
 */
async function startBot() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    📝 Izin Catat — WhatsApp Bot      ║');
  console.log('║    Pencatatan Keuangan Pribadi        ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  // 1. Test koneksi database
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Tidak bisa lanjut tanpa koneksi database. Periksa DATABASE_URL di .env');
    process.exit(1);
  }

  // 2. Load auth state (session)
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  // 3. Ambil versi terbaru Baileys
  const { version } = await fetchLatestBaileysVersion();
  console.log(`📱 Menggunakan Baileys versi: ${version.join('.')}`);

  // 4. Buat socket koneksi
  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    generateHighQualityLinkPreview: false,
    defaultQueryTimeoutMs: undefined,
  });

  // 5. Event: credentials updated → simpan session
  sock.ev.on('creds.update', saveCreds);

  // 6. Event: connection update
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.clear();
      console.log('╔══════════════════════════════════════╗');
      console.log('║    📝 Izin Catat — Scan QR Code      ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');
      // Tampilkan QR code di terminal
      qrcode.generate(qr, { small: true });
      console.log('');
      console.log('📱 Scan QR code di atas dengan WhatsApp kamu ya!');
      console.log('   Buka WhatsApp → Linked Devices → Link a Device');
      console.log('');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `⚠️ Koneksi terputus (kode: ${statusCode}).`,
        shouldReconnect ? 'Mencoba reconnect...' : 'Logged out, silakan hapus folder auth_info_baileys dan scan ulang.'
      );

      if (shouldReconnect) {
        // Reconnect otomatis
        setTimeout(() => startBot(), 3000);
      } else {
        stopScheduler();
        process.exit(0);
      }
    }

    if (connection === 'open') {
      console.log('');
      console.log('✅ Bot Izin Catat berhasil terhubung ke WhatsApp!');
      console.log('📝 Siap menerima pesan...');
      console.log('');

      // Stop scheduler lama (jika ada dari reconnect) lalu setup ulang dengan socket baru
      stopScheduler();
      setupScheduler(createSock(sock));
    }
  });

  // Set untuk deduplikasi pesan (cegah double processing)
  const processedIds = new Set();
  setInterval(() => processedIds.clear(), 5 * 60 * 1000); // Bersihkan tiap 5 menit

  // 7. Event: pesan masuk
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const messages = m.messages;

      for (const msg of messages) {
        // Skip jika bukan pesan baru (broadcast update, dll)
        if (m.type !== 'notify') continue;

        // Skip pesan dari bot sendiri
        if (msg.key.fromMe) continue;

        // Skip jika pesan sudah pernah diproses (cegah double processing)
        const msgId = msg.key.id;
        if (processedIds.has(msgId)) continue;
        processedIds.add(msgId);

        // Skip pesan dari grup — hanya handle pesan personal
        if (msg.key.remoteJid.endsWith('@g.us')) continue;

        // Skip pesan status/broadcast
        if (msg.key.remoteJid === 'status@broadcast') continue;

        // Ambil info sender
        const sender = msg.key.remoteJid;
        const pushName = msg.pushName || null;

        // Cek apakah pesan adalah voice note (ptt) atau audio
        const isVoiceNote = !!(msg.message?.pttMessage || msg.message?.audioMessage);
        let pesanText = null;

        if (isVoiceNote) {
          // ── Handle Voice Note ────────────────────────────────────
          try {
            console.log(`🎤 Voice note dari ${pushName || sender} — transkripsi...`);

            const buffer = await downloadMediaMessage(
              msg,
              'buffer',
              {},
              { logger, reuploadRequest: sock.updateMediaMessage }
            );

            const { success, text } = await transcribeAudio(buffer);

            const waSock = createSock(sock);
            if (!success || !text) {
              await waSock.sendMessage(sender, {
                text: 'Maaf, tidak bisa mendengar pesanmu. Coba ulangi atau ketik pesannya ya.',
              });
              continue;
            }

            pesanText = text;
            console.log(`📝 Transkripsi: "${pesanText}"`);

            // Beritahu user apa yang didengar oleh bot
            await waSock.sendMessage(sender, {
              text: `🎤 _Saya dengar:_ "${pesanText}"`,
            });
          } catch (voiceErr) {
            console.error('Error memproses voice note:', voiceErr);
            await createSock(sock).sendMessage(sender, {
              text: 'Gagal memproses pesan suara. Coba ketik pesannya ya.',
            });
            continue;
          }
        } else {
          // ── Handle Teks Biasa ────────────────────────────────────
          pesanText = extractMessageText(msg);
          if (!pesanText || pesanText.trim() === '') continue;
        }

        console.log(`📩 Pesan dari ${pushName || sender}: "${pesanText}"`);

        // Route ke handler
        await handleMessage(createSock(sock), sender, pesanText, pushName);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  return sock;
}

/**
 * Ekstrak teks dari berbagai tipe pesan WhatsApp.
 * @param {object} msg - Objek pesan Baileys
 * @returns {string|null}
 */
function extractMessageText(msg) {
  const message = msg.message;
  if (!message) return null;

  // Teks biasa
  if (message.conversation) {
    return message.conversation;
  }

  // Extended text (reply, link preview, dll)
  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  // Pesan dengan caption (gambar/video dengan teks)
  if (message.imageMessage?.caption) {
    return message.imageMessage.caption;
  }

  if (message.videoMessage?.caption) {
    return message.videoMessage.caption;
  }

  // Document dengan caption
  if (message.documentMessage?.caption) {
    return message.documentMessage.caption;
  }

  return null;
}

module.exports = { startBot };
