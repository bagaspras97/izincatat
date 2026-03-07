/**
 * WA Service — Izin Catat
 * Abstraction layer pengiriman pesan WhatsApp.
 *
 * Mendukung dua mode (pilih via env WA_PROVIDER):
 *   - "baileys" (default) : gunakan socket Baileys langsung
 *   - "wablas"            : gunakan Wablas REST API
 *
 * Semua handler tetap memanggil:
 *   await sock.sendMessage(sender, { text: '...' })
 *   await sock.sendMessage(sender, { image: buffer, caption: '...' })
 *
 * dengan `sock` yang dikembalikan oleh createSock().
 */

const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

// ═══════════════════════════════════════════════
//  WABLAS HTTP HELPER
// ═══════════════════════════════════════════════

/**
 * Kirim HTTP request ke Wablas API.
 * Menggunakan built-in https/http tanpa dependency tambahan.
 */
function wablasRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const baseUrl = process.env.WABLAS_URL || 'https://solo.wablas.com';
    const token = process.env.WABLAS_TOKEN;

    const parsed = new URL(path, baseUrl);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (parseErr) { 
          console.debug('[WA] Response bukan JSON:', parseErr.message);
          resolve({ status: false, message: data }); 
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ═══════════════════════════════════════════════
//  NORMALISASI NOMOR
// ═══════════════════════════════════════════════

/**
 * Konversi format nomor WA ke format yang dibutuhkan provider.
 * Baileys menggunakan: "6281234567890@s.whatsapp.net"
 * Wablas menggunakan:  "6281234567890"
 */
function normalizePhone(jid) {
  return jid.replace(/@.*$/, '');
}

// ═══════════════════════════════════════════════
//  WABLAS SENDER
// ═══════════════════════════════════════════════

async function wablasSendText(jid, text) {
  const phone = normalizePhone(jid);
  try {
    await wablasRequest('POST', '/api/v2/send-message', {
      data: [{ phone, message: text }],
    });
  } catch (err) {
    console.error(`[WA] Gagal kirim teks ke ${phone}:`, err.message);
    throw err;
  }
}

async function wablasSendImage(jid, imageBuffer, caption) {
  const phone = normalizePhone(jid);
  // Wablas butuh URL gambar, bukan buffer langsung.
  // Upload ke endpoint upload Wablas terlebih dahulu, lalu kirim URL-nya.
  try {
    // 1. Upload image ke Wablas
    const base64 = imageBuffer.toString('base64');
    const uploadRes = await wablasRequest('POST', '/api/v2/upload-media', {
      phone,
      base64,
      type: 'image',
    });

    const imageUrl = uploadRes?.data?.url || uploadRes?.url;
    if (!imageUrl) throw new Error('Upload gambar gagal: ' + JSON.stringify(uploadRes));

    // 2. Kirim gambar via URL
    await wablasRequest('POST', '/api/v2/send-image', {
      data: [{ phone, image: imageUrl, caption: caption || '' }],
    });
  } catch (err) {
    console.error(`[WA] Gagal kirim gambar ke ${phone}:`, err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════
//  SOCK FACTORY
// ═══════════════════════════════════════════════

/**
 * Buat objek `sock` yang kompatibel dengan semua handler.
 * Mode ditentukan oleh env WA_PROVIDER.
 *
 * Untuk mode "baileys", kembalikan socket Baileys asli.
 * Untuk mode "wablas", kembalikan objek mock dengan interface yang sama.
 *
 * @param {object|null} baileysSocket - Socket Baileys (null jika mode wablas)
 * @returns {object} sock dengan method sendMessage & sendPresenceUpdate
 */
function createSock(baileysSocket = null) {
  const provider = (process.env.WA_PROVIDER || 'baileys').toLowerCase();

  if (provider === 'baileys') {
    if (!baileysSocket) throw new Error('baileysSocket diperlukan untuk mode baileys');
    return baileysSocket;
  }

  // ── Mode Wablas ──
  return {
    sendMessage: async (jid, content) => {
      if (content.text) {
        await wablasSendText(jid, content.text);
      } else if (content.image) {
        const caption = content.caption || '';
        await wablasSendImage(jid, content.image, caption);
      }
      // Format lain (sticker, dll) diabaikan — tidak dipakai Izin Catat
    },

    // Presence update tidak didukung Wablas — no-op
    sendPresenceUpdate: async () => {},
  };
}

// Singleton wablas sock — dibuat sekali, dipakai scheduler & server
let _wablasSock = null;

function getWablasSock() {
  if (!_wablasSock) {
    _wablasSock = createSock(null);
  }
  return _wablasSock;
}

module.exports = { createSock, getWablasSock, normalizePhone };
