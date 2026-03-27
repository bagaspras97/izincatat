/**
 * WA Service — Izin Catat
 * Abstraction layer pengiriman pesan WhatsApp.
 *
 * Mendukung tiga mode (pilih via env WA_PROVIDER):
 *   - "baileys"   (default) : gunakan socket Baileys langsung
 *   - "wablas"              : gunakan Wablas REST API
 *   - "cloudapi"            : gunakan WhatsApp Cloud API (Meta/official)
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

// Persistent agents — reuse TCP/TLS connections antar requests (menghindari TLS handshake berulang)
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 5 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 5 });

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
      agent: isHttps ? httpsAgent : httpAgent,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const tWablas = Date.now();
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[WA] ${method} ${parsed.pathname} → ${Date.now() - tWablas}ms (status ${res.statusCode})`);
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
    const result = await wablasRequest('POST', '/api/v2/send-message', {
      data: [{ phone, message: text }],
    });
    console.log(`[WA] sendMessage ke ${phone}:`, JSON.stringify(result));
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
//  WHATSAPP CLOUD API HELPER
// ═══════════════════════════════════════════════

/**
 * Kirim HTTP request ke Meta Graph API.
 */
function cloudApiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.WHATSAPP_TOKEN;
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: 'graph.facebook.com',
      path,
      method,
      agent: httpsAgent,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const tApi = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[WA CloudAPI] ${method} ${path} → ${Date.now() - tApi}ms (status ${res.statusCode})`);
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function cloudApiSendText(jid, text) {
  const phone = normalizePhone(jid);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  try {
    const result = await cloudApiRequest('POST', `/v18.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text, preview_url: false },
    });
    if (result.error) {
      console.error('[WA CloudAPI] Error kirim teks:', JSON.stringify(result.error));
      throw new Error(result.error.message);
    }
  } catch (err) {
    console.error(`[WA CloudAPI] Gagal kirim teks ke ${phone}:`, err.message);
    throw err;
  }
}

/**
 * Upload buffer gambar ke Cloud API, kembalikan media_id.
 * Menggunakan multipart/form-data tanpa dependency tambahan.
 */
function cloudApiUploadMedia(imageBuffer, mimeType = 'image/png') {
  return new Promise((resolve, reject) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const boundary = `----FormBoundary${Date.now()}`;

    // Build multipart body
    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="type"\r\n\r\n${mimeType}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="chart.png"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([pre, imageBuffer, post]);

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${phoneNumberId}/media`,
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function cloudApiSendImage(jid, imageBuffer, caption) {
  const phone = normalizePhone(jid);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  try {
    // 1. Upload media → dapatkan media_id
    const uploadRes = await cloudApiUploadMedia(imageBuffer, 'image/png');
    const mediaId = uploadRes?.id;
    if (!mediaId) throw new Error('Upload media gagal: ' + JSON.stringify(uploadRes));

    // 2. Kirim gambar via media_id
    const result = await cloudApiRequest('POST', `/v18.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'image',
      image: { id: mediaId, caption: caption || '' },
    });
    if (result.error) {
      console.error('[WA CloudAPI] Error kirim gambar:', JSON.stringify(result.error));
      throw new Error(result.error.message);
    }
  } catch (err) {
    console.error(`[WA CloudAPI] Gagal kirim gambar ke ${phone}:`, err.message);
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
 * Untuk mode "wablas" / "cloudapi", kembalikan objek mock dengan interface yang sama.
 *
 * @param {object|null} baileysSocket - Socket Baileys (null jika mode wablas/cloudapi)
 * @returns {object} sock dengan method sendMessage & sendPresenceUpdate
 */
function createSock(baileysSocket = null) {
  const provider = (process.env.WA_PROVIDER || 'baileys').toLowerCase();

  if (provider === 'baileys') {
    if (!baileysSocket) throw new Error('baileysSocket diperlukan untuk mode baileys');
    return baileysSocket;
  }

  if (provider === 'cloudapi') {
    return {
      sendMessage: async (jid, content) => {
        if (content.text) {
          await cloudApiSendText(jid, content.text);
        } else if (content.image) {
          await cloudApiSendImage(jid, content.image, content.caption || '');
        }
      },
      sendPresenceUpdate: async () => {},
    };
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

// Singleton cloudapi sock
let _cloudApiSock = null;

function getCloudApiSock() {
  if (!_cloudApiSock) {
    _cloudApiSock = createSock(null);
  }
  return _cloudApiSock;
}

module.exports = { createSock, getWablasSock, getCloudApiSock, normalizePhone };
