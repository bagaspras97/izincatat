/**
 * Intent Detector Service — Izin Catat
 * Parsing pesan natural language menggunakan Groq llama-3.3-70b-versatile.
 * Digunakan sebagai fallback ketika tidak ada keyword yang cocok.
 *
 * Intent yang didukung:
 *  - catat     → catat transaksi masuk/keluar
 *  - hapus     → hapus transaksi berdasarkan ID
 *  - saldo     → cek saldo
 *  - laporan   → laporan keuangan (hari/minggu/bulan)
 *  - riwayat   → daftar riwayat transaksi
 *  - bantuan   → info cara pakai bot
 *  - tidak_relevan → pesan di luar konteks keuangan
 */

const Groq = require('groq-sdk');

// Lazy init agar tidak crash kalau GROQ_API_KEY belum di-set
let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY belum di-set di file .env');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `Parser pesan keuangan WhatsApp. Kembalikan JSON saja, tanpa penjelasan.

Format: {"intent":"...","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}

Intent: catat|hapus|saldo|laporan|riwayat|bantuan|info_bot|tidak_relevan

Rules:
- catat: ada uang masuk/keluar. jenis="keluar"(beli/bayar/jajan) atau "masuk"(gaji/terima/dapat). nominal=angka bulat. keterangan=deskripsi singkat.
- hapus: id=nomor transaksi
- laporan: periode="hari"|"minggu"|"bulan" (default "bulan")
- Konversi: 25rb/25k=25000, 1jt=1000000, 2.5jt=2500000
- Default jenis ke "keluar" jika tidak jelas tapi ada nominal

Contoh:
"beli kopi 25rb" → {"intent":"catat","jenis":"keluar","nominal":25000,"keterangan":"beli kopi","periode":null,"id":null}
"terima gaji 5jt" → {"intent":"catat","jenis":"masuk","nominal":5000000,"keterangan":"gaji","periode":null,"id":null}
"hapus nomor 7" → {"intent":"hapus","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":7}
"rekap minggu ini" → {"intent":"laporan","jenis":null,"nominal":null,"keterangan":null,"periode":"minggu","id":null}
"halo" → {"intent":"tidak_relevan","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}`;

/**
 * Deteksi intent dari pesan natural language.
 *
 * @param {string} pesan - Teks pesan dari user
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
async function detectIntent(pesan) {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pesan },
      ],
      temperature: 0.1,      // Rendah agar deterministik
      max_tokens: 150,        // JSON singkat, tidak perlu banyak
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, data: null, error: 'Respons kosong dari AI' };
    }

    // Ekstrak JSON dari response (model kadang membungkus dengan ```json ... ```)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[IntentDetector] Tidak ada JSON di response:', raw);
      return { success: false, data: null, error: 'JSON tidak ditemukan di response' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validasi minimal: field intent harus ada
    if (!parsed.intent) {
      return { success: false, data: null, error: 'Field intent tidak ditemukan' };
    }

    console.log(`[IntentDetector] "${pesan}" → intent: ${parsed.intent}`);
    return { success: true, data: parsed, error: null };
  } catch (err) {
    console.error('[IntentDetector] Error:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

module.exports = { detectIntent };
