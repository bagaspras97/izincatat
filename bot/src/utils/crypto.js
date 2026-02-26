/**
 * Crypto Utility — Izin Catat
 * Enkripsi/dekripsi field sensitif menggunakan AES-256-GCM.
 *
 * Format ciphertext: "<iv_hex>:<authTag_hex>:<encrypted_hex>"
 *
 * ENCRYPTION_KEY harus 64 karakter hex (= 32 byte) di .env
 * Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('node:crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV — recommended untuk GCM
const TAG_LENGTH = 16;

/**
 * Ambil encryption key dari env, validasi panjangnya.
 */
function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY tidak valid. Harus 64 karakter hex (32 byte).\n' +
        'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Enkripsi string plaintext.
 * @param {string} text
 * @returns {string} "<iv>:<authTag>:<ciphertext>" dalam hex
 */
function encrypt(text) {
  if (text == null) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Dekripsi ciphertext.
 * @param {string} encryptedText - format "<iv>:<authTag>:<ciphertext>"
 * @returns {string} plaintext asli
 */
function decrypt(encryptedText) {
  if (encryptedText == null) return encryptedText;

  // Fallback: kalau belum dienkripsi (migrasi data lama), kembalikan apa adanya
  if (!encryptedText.includes(':')) return encryptedText;

  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // bukan format enkripsi kita

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    // Jika gagal dekripsi (data corrupt atau belum dienkripsi), kembalikan raw
    return encryptedText;
  }
}

/**
 * Dekripsi object transaksi dari DB — kembalikan kopi baru dengan field terdekripsi.
 * @param {object|null} transaksi
 * @returns {object|null}
 */
function decryptTransaksi(transaksi) {
  if (!transaksi) return transaksi;
  return {
    ...transaksi,
    keterangan: decrypt(transaksi.keterangan),
  };
}

/**
 * Dekripsi array transaksi dari DB.
 * @param {object[]} list
 * @returns {object[]}
 */
function decryptTransaksiList(list) {
  return list.map(decryptTransaksi);
}

module.exports = { encrypt, decrypt, decryptTransaksi, decryptTransaksiList };
