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

const SYSTEM_PROMPT = `Kamu adalah parser pesan untuk aplikasi pencatatan keuangan WhatsApp berbahasa Indonesia bernama "Izin Catat".

Tugasmu HANYA menganalisis pesan user dan mengembalikan JSON. Jangan tambahkan penjelasan apapun.

Kembalikan JSON dengan struktur PERSIS seperti ini:
{"intent":"...","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}

Nilai intent yang valid:
- "catat"         → user menyebut ada uang keluar atau masuk (beli, bayar, belanja, terima, dapat, gaji, dll)
- "hapus"         → user ingin hapus/batalkan/delete transaksi
- "saldo"         → user tanya saldo, balance, uang tersisa, punya uang berapa
- "laporan"       → user minta laporan, ringkasan, rekap, summary keuangan
- "riwayat"       → user minta daftar/list transaksi
- "bantuan"       → user minta bantuan, cara pakai, fitur apa saja, help, menu
- "tidak_relevan" → tidak ada hubungan dengan keuangan sama sekali

Field tambahan (isi jika ada, null jika tidak):
- jenis    : "keluar" (pengeluaran) atau "masuk" (pemasukan) — hanya untuk intent "catat"
- nominal  : angka saja tanpa titik/koma (contoh: 25000, tidak "25.000") — hanya untuk "catat"
- keterangan: deskripsi singkat transaksi — hanya untuk "catat"
- periode  : "hari", "minggu", atau "bulan" — hanya untuk "laporan", default "bulan" jika tidak disebutkan
- id       : angka integer ID transaksi — hanya untuk "hapus"

Konversi nominal:
- "25rb" / "25ribu" / "25k" / "25.000" → 25000
- "1jt" / "1juta" / "1.000.000" → 1000000
- "2.5jt" / "2,5 juta" → 2500000
- "500" dengan konteks keuangan → 500

Penentuan jenis:
- "keluar" → beli, bayar, belanja, jajan, makan, nongkrong, isi, transfer keluar, dll
- "masuk"  → terima, gaji, dapat, transfer masuk, dibayar, cashback, bonus, dll
- Default ke "keluar" jika tidak jelas tapi ada nominal

Contoh input → output:
"kemarin beli kopi 25rb" → {"intent":"catat","jenis":"keluar","nominal":25000,"keterangan":"beli kopi","periode":null,"id":null}
"tadi terima gaji 5jt" → {"intent":"catat","jenis":"masuk","nominal":5000000,"keterangan":"gaji","periode":null,"id":null}
"makan siang 35000" → {"intent":"catat","jenis":"keluar","nominal":35000,"keterangan":"makan siang","periode":null,"id":null}
"isi bensin 150rb" → {"intent":"catat","jenis":"keluar","nominal":150000,"keterangan":"isi bensin","periode":null,"id":null}
"hapus transaksi 42" → {"intent":"hapus","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":42}
"hapus nomor 7" → {"intent":"hapus","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":7}
"berapa saldo aku?" → {"intent":"saldo","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}
"minta laporan bulan ini" → {"intent":"laporan","jenis":null,"nominal":null,"keterangan":null,"periode":"bulan","id":null}
"rekap minggu ini" → {"intent":"laporan","jenis":null,"nominal":null,"keterangan":null,"periode":"minggu","id":null}
"list transaksi" → {"intent":"riwayat","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}
"cara pakai bot ini gimana?" → {"intent":"bantuan","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}
"halo selamat pagi" → {"intent":"tidak_relevan","jenis":null,"nominal":null,"keterangan":null,"periode":null,"id":null}`;

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
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pesan },
      ],
      temperature: 0.1,      // Rendah agar deterministik
      max_tokens: 150,        // JSON singkat, tidak perlu banyak
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, data: null, error: 'Respons kosong dari AI' };
    }

    const parsed = JSON.parse(raw);

    // Validasi minimal: field intent harus ada
    if (!parsed.intent) {
      return { success: false, data: null, error: 'Field intent tidak ditemukan' };
    }

    return { success: true, data: parsed, error: null };
  } catch (err) {
    console.error('[IntentDetector] Error:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

module.exports = { detectIntent };
