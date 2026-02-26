/**
 * Whisper Service — Izin Catat
 * Transkripsi audio (voice note WhatsApp) menggunakan Groq Whisper API.
 * Model: whisper-large-v3-turbo — cepat, akurat, gratis di Groq free tier.
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

/**
 * Transkripsi audio buffer menggunakan Groq Whisper API.
 *
 * @param {Buffer} audioBuffer - Buffer audio dari WhatsApp (format .ogg/opus)
 * @param {string} [filename='voice.ogg'] - Nama file (untuk hint format ke API)
 * @returns {Promise<{ success: boolean, text: string|null, error: string|null }>}
 */
async function transcribeAudio(audioBuffer, filename = 'voice.ogg') {
  try {
    const groq = getGroqClient();

    // Bungkus buffer menjadi File-like object yang bisa dikirim ke API
    const { toFile } = require('groq-sdk');
    const audioFile = await toFile(audioBuffer, filename, {
      type: 'audio/ogg; codecs=opus',
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'id',           // Bahasa Indonesia
      response_format: 'json',
    });

    const text = transcription.text?.trim();

    if (!text) {
      return { success: false, text: null, error: 'Transkripsi kosong' };
    }

    return { success: true, text, error: null };
  } catch (err) {
    console.error('[Whisper] Error transkripsi:', err.message);
    return { success: false, text: null, error: err.message };
  }
}

module.exports = { transcribeAudio };
