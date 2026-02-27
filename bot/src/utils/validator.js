/**
 * Validator — Izin Catat
 * Fungsi validasi input user: nominal, jenis, keterangan, dsb.
 */

/**
 * Mapping satuan angka Indonesia ke multiplier.
 * Mendukung: ribu, rb, k, juta, jt, m, miliar, M
 */
const SATUAN_MULTIPLIER = [
  { pattern: /^(miliar|milyar)$/i, multiplier: 1_000_000_000 },
  { pattern: /^(juta|jt)$/i,      multiplier: 1_000_000 },
  { pattern: /^(ribu|rb|k)$/i,    multiplier: 1_000 },
];

/**
 * Parse teks nominal + opsional satuan menjadi angka.
 * Mendukung format:
 *   - Angka biasa   : 25000, 25.000
 *   - Dengan satuan : 10ribu, 10rb, 10k, 5juta, 5jt, 2miliar
 *   - Dua token     : "10" + "ribu", "5" + "juta"  (di-handle parseCatat)
 * @param {string} text
 * @returns {{ valid: boolean, nominal: number|null, error: string }}
 */
function validasiNominal(text) {
  if (!text || text.trim() === '') {
    return { valid: false, nominal: null, error: 'Nominal tidak boleh kosong.' };
  }

  let cleaned = text.trim().toLowerCase();

  // Hapus prefix "rp"
  if (cleaned.startsWith('rp')) {
    cleaned = cleaned.substring(2).trim();
  }

  // Cek apakah ada satuan yang menempel di belakang angka
  // Contoh: "10ribu", "5juta", "2jt", "10k", "10rb"
  const SATUAN_REGEX = /^([\d.,]+)\s*(miliar|milyar|juta|jt|ribu|rb|k)$/i;
  const saatuanMatch = SATUAN_REGEX.exec(cleaned);
  if (saatuanMatch) {
    const angkaPart = saatuanMatch[1].replaceAll('.', '').replaceAll(',', '.');
    const satuanPart = saatuanMatch[2];
    const angka = Number.parseFloat(angkaPart);

    if (!Number.isNaN(angka)) {
      for (const { pattern, multiplier } of SATUAN_MULTIPLIER) {
        if (pattern.test(satuanPart)) {
          return _validasiHasil(angka * multiplier);
        }
      }
    }
  }

  // Format angka biasa: 25000, 25.000
  const angkaBiasa = cleaned.replaceAll('.', '').replaceAll(',', '.');
  const nominal = Number.parseFloat(angkaBiasa);

  if (Number.isNaN(nominal)) {
    return {
      valid: false,
      nominal: null,
      error:
        'Nominal tidak valid. Contoh:\n' +
        '• 25000\n' +
        '• 25ribu atau 25rb atau 25k\n' +
        '• 5juta atau 5jt',
    };
  }

  return _validasiHasil(nominal);
}

/** Helper validasi range nominal */
function _validasiHasil(nominal) {
  if (nominal <= 0) {
    return { valid: false, nominal: null, error: 'Nominal harus lebih dari 0.' };
  }
  if (nominal > 99_999_999_999) {
    return { valid: false, nominal: null, error: 'Nominal terlalu besar. Maksimal Rp 99.999.999.999.' };
  }
  return { valid: true, nominal, error: '' };
}

/**
 * Validasi jenis transaksi.
 * @param {string} text
 * @returns {{ valid: boolean, jenis: string, error: string }}
 */
function validasiJenis(text) {
  const jenis = text.trim().toLowerCase();

  const aliasMasuk = ['masuk', 'pemasukan', 'income', 'in'];
  const aliasKeluar = ['keluar', 'pengeluaran', 'expense', 'out'];

  if (aliasMasuk.includes(jenis)) {
    return { valid: true, jenis: 'masuk', error: '' };
  }

  if (aliasKeluar.includes(jenis)) {
    return { valid: true, jenis: 'keluar', error: '' };
  }

  return {
    valid: false,
    jenis: '',
    error: "Jenis transaksi harus 'masuk' atau 'keluar' ya Kak.",
  };
}

// Regex untuk token nominal (angka + opsional satuan menempel)
const NOMINAL_TOKEN = /^[\d.,]+(miliar|milyar|juta|jt|ribu|rb|k)?$/i;
// Regex satuan berdiri sendiri
const SATUAN_STANDALONE_RE = /^(miliar|milyar|juta|jt|ribu|rb|k)$/i;

/**
 * Ekstrak nominalText dan keteranganParts dari sisa token pesan.
 * Mendukung nominal di posisi awal maupun akhir.
 * @param {string[]} rest
 * @returns {{ nominalText: string|null, keteranganParts: string[]|null }}
 */
function _detectNominal(rest) {
  // Nominal di awal: "25000 makan siang" atau "25 ribu makan siang"
  if (NOMINAL_TOKEN.test(rest[0])) {
    if (rest[1] && SATUAN_STANDALONE_RE.test(rest[1])) {
      return { nominalText: rest[0] + rest[1], keteranganParts: rest.slice(2) };
    }
    return { nominalText: rest[0], keteranganParts: rest.slice(1) };
  }

  // Nominal di akhir: "makan siang 25000" atau "makan siang 25 ribu"
  if (NOMINAL_TOKEN.test(rest.at(-1))) {
    const lastToken = rest.at(-1);
    const secondLast = rest.at(-2);
    if (secondLast && NOMINAL_TOKEN.test(secondLast) && SATUAN_STANDALONE_RE.test(lastToken)) {
      return { nominalText: secondLast + lastToken, keteranganParts: rest.slice(0, -2) };
    }
    return { nominalText: lastToken, keteranganParts: rest.slice(0, -1) };
  }

  return { nominalText: null, keteranganParts: null };
}

/**
 * Parse command catat dari pesan user.
 * Format: catat [jenis] [nominal] [keterangan...]
 *
 * Mendukung nominal di awal atau akhir keterangan:
 *   catat keluar 25000 makan siang
 *   catat keluar makan siang 25000
 *   catat keluar 25 ribu makan siang
 *
 * @param {string} pesan - Pesan lengkap dari user
 * @returns {{ valid: boolean, data: object|null, error: string }}
 */
function parseCatat(pesan) {
  const parts = pesan.trim().split(/\s+/);

  // Minimal: catat jenis nominal keterangan (4 kata)
  if (parts.length < 4) {
    return {
      valid: false,
      data: null,
      error:
        'Format kurang lengkap. Gunakan:\n' +
        '_catat keluar [nominal] [keterangan]_\n' +
        '_catat masuk [nominal] [keterangan]_\n\n' +
        'Contoh: _catat keluar 25000 makan siang_',
    };
  }

  const { valid: validJenis, jenis, error: errorJenis } = validasiJenis(parts[1]);
  if (!validJenis) {
    return { valid: false, data: null, error: errorJenis };
  }

  const rest = parts.slice(2);
  const { nominalText, keteranganParts } = _detectNominal(rest);

  if (!nominalText) {
    return {
      valid: false,
      data: null,
      error:
        'Nominal tidak ditemukan. Contoh:\n' +
        '_catat keluar 25000 makan siang_\n' +
        '_catat keluar makan siang 25000_',
    };
  }

  if (!keteranganParts || keteranganParts.length === 0) {
    return {
      valid: false,
      data: null,
      error: 'Keterangan wajib diisi. Contoh: _catat keluar 25000 makan siang_',
    };
  }

  const { valid: validNominal, nominal, error: errorNominal } = validasiNominal(nominalText);
  if (!validNominal) {
    return { valid: false, data: null, error: errorNominal };
  }

  const keterangan = keteranganParts.join(' ').trim();
  if (!keterangan) {
    return {
      valid: false,
      data: null,
      error: 'Keterangan wajib diisi. Contoh: _catat keluar 25000 makan siang_',
    };
  }

  if (keterangan.length > 500) {
    return {
      valid: false,
      data: null,
      error: 'Keterangan terlalu panjang. Maksimal 500 karakter.',
    };
  }

  return {
    valid: true,
    data: { jenis, nominal, keterangan },
    error: '',
  };
}

/**
 * Validasi ID transaksi untuk command hapus.
 * @param {string} text
 * @returns {{ valid: boolean, id: number|null, error: string }}
 */
function validasiIdTransaksi(text) {
  const cleaned = text.trim().replace(/^#/, '');
  const id = Number.parseInt(cleaned, 10);

  if (Number.isNaN(id) || id <= 0) {
    return {
      valid: false,
      id: null,
      error: 'ID transaksi tidak valid. Contoh: _hapus 42_',
    };
  }

  return { valid: true, id, error: '' };
}

module.exports = {
  validasiNominal,
  validasiJenis,
  parseCatat,
  validasiIdTransaksi,
  normalisasiAngkaKata,
};

/**
 * Konversi urutan kata angka Indonesia menjadi digit dalam sebuah teks.
 * Mendukung angka hingga ratusan juta — cocok untuk nominal dan ID transaksi.
 * Contoh: "hapus dua" → "hapus 2"
 *         "catat keluar dua puluh lima ribu makan siang" → "catat keluar 25000 makan siang"
 * @param {string} text
 * @returns {string}
 */
function normalisasiAngkaKata(text) {
  const DIGIT = {
    nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4,
    lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
  };

  const VALID_STARTS = new Set([
    ...Object.keys(DIGIT),
    'sepuluh', 'sebelas', 'seratus', 'seribu', 'sejuta', 'se',
  ]);

  const toks = text.toLowerCase().split(/\s+/);
  const out = [];
  let i = 0;

  while (i < toks.length) {
    const parsed = parseNumber(toks, i);
    if (parsed) {
      out.push(parsed.value.toString());
      i += parsed.consumed;
    } else {
      out.push(toks[i]);
      i++;
    }
  }

  return out.join(' ');

  // ── Helper parsers ───────────────────────────────────────────

  function dg(tok) { return tok != null ? (DIGIT[tok.toLowerCase()] ?? null) : null; }

  /** Parse 1–99 */
  function parseBawahRatus(toks, i) {
    const t0 = toks[i]?.toLowerCase();
    const t1 = toks[i + 1]?.toLowerCase();
    const t2 = toks[i + 2]?.toLowerCase();
    if (!t0) return null;

    if (t0 === 'sepuluh') return { value: 10, consumed: 1 };
    if (t0 === 'sebelas') return { value: 11, consumed: 1 };

    const d0 = dg(t0);
    if (d0 === null) return null;

    if (t1 === 'belas' && d0 >= 2) return { value: 10 + d0, consumed: 2 };
    if (t1 === 'puluh') {
      const d2 = dg(t2);
      if (d2 !== null && d2 >= 1) return { value: d0 * 10 + d2, consumed: 3 };
      return { value: d0 * 10, consumed: 2 };
    }
    return { value: d0, consumed: 1 };
  }

  /** Parse 1–999 */
  function parseBawahRibu(toks, i) {
    const t0 = toks[i]?.toLowerCase();
    const t1 = toks[i + 1]?.toLowerCase();
    let ratusan = 0;
    let hConsumed = 0;

    if (t0 === 'seratus') {
      ratusan = 100; hConsumed = 1;
    } else if (t0 === 'se' && t1 === 'ratus') {
      ratusan = 100; hConsumed = 2;
    } else {
      const d0 = dg(t0);
      if (d0 !== null && d0 >= 1 && t1 === 'ratus') {
        ratusan = d0 * 100; hConsumed = 2;
      }
    }

    const rest = parseBawahRatus(toks, i + hConsumed);
    if (rest) return { value: ratusan + rest.value, consumed: hConsumed + rest.consumed };
    if (hConsumed > 0) return { value: ratusan, consumed: hConsumed };

    return parseBawahRatus(toks, i);
  }

  /** Parse angka penuh (1–ratusan juta) */
  function parseNumber(toks, i) {
    const t0 = toks[i]?.toLowerCase();
    if (!t0 || !VALID_STARTS.has(t0)) return null;

    let value = 0;
    let pos = i;

    // ── Juta ─────────────────────────────────────────────────
    if (t0 === 'sejuta') {
      value += 1_000_000;
      pos++;
    } else {
      const sub = parseBawahRibu(toks, pos);
      if (sub && toks[pos + sub.consumed]?.toLowerCase() === 'juta') {
        value += sub.value * 1_000_000;
        pos += sub.consumed + 1;
      }
    }

    // ── Ribu ─────────────────────────────────────────────────
    const tRibu = toks[pos]?.toLowerCase();
    if (tRibu === 'seribu') {
      value += 1_000;
      pos++;
    } else if (tRibu && VALID_STARTS.has(tRibu)) {
      const sub = parseBawahRibu(toks, pos);
      if (sub && toks[pos + sub.consumed]?.toLowerCase() === 'ribu') {
        value += sub.value * 1_000;
        pos += sub.consumed + 1;
      }
    }

    // ── Sisa di bawah 1000 ───────────────────────────────────
    const tRem = toks[pos]?.toLowerCase();
    if (tRem && VALID_STARTS.has(tRem)) {
      const sub = parseBawahRibu(toks, pos);
      if (sub) { value += sub.value; pos += sub.consumed; }
    }

    // Jika tidak ada magnitude (juta/ribu), parse sebagai angka biasa
    if (pos === i) {
      const plain = parseBawahRibu(toks, i);
      if (plain) return plain;
      return null;
    }

    return { value, consumed: pos - i };
  }
}
