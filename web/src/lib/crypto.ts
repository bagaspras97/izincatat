/**
 * Crypto Utility — Izin Catat (Web)
 * Enkripsi/dekripsi field sensitif menggunakan AES-256-GCM.
 *
 * Format ciphertext: "<iv_hex>:<authTag_hex>:<encrypted_hex>"
 *
 * ENCRYPTION_KEY harus 64 karakter hex (= 32 byte) di .env
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY tidak valid. Harus 64 karakter hex (32 byte).'
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = (cipher as crypto.CipherGCM).getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  if (!encryptedText.includes(':')) return encryptedText; // data lama belum dienkripsi

  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    }) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return encryptedText; // fallback: data belum/tidak bisa didekripsi
  }
}
