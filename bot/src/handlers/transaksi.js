/**
 * Handler Transaksi — Izin Catat
 * Menangani pencatatan transaksi (catat masuk / catat keluar)
 * dan penghapusan transaksi (hapus [id]).
 */

const { simpanTransaksi, getSaldoHariIni, getTransaksiById, hapusTransaksi } = require('../database/queries');
const { autoKategorisasi } = require('../services/kategorisasi');
const { parseCatat, validasiIdTransaksi } = require('../utils/validator');
const {
  pesanTransaksiBerhasil,
  pesanKonfirmasiHapus,
  pesanHapusBerhasil,
  pesanBatalHapus,
  pesanKonfirmasiExpired,
  pesanKonfirmasiTidakDikenali,
  pesanErrorTransaksiNotFound,
  pesanErrorUmum,
} = require('../utils/pesan');

/**
 * Handle command "catat".
 * Format: catat keluar 25000 makan siang
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {string} pesan - Pesan lengkap
 * @param {object} user - Data user dari database
 */
async function handleCatat(sock, sender, pesan, user) {
  try {
    // Parse & validasi input
    const { valid, data, error } = parseCatat(pesan);

    if (!valid) {
      await sock.sendMessage(sender, { text: error });
      return;
    }

    // Auto kategorisasi berdasarkan keterangan
    const kategori = autoKategorisasi(data.keterangan, data.jenis);

    // Simpan ke database
    const transaksi = await simpanTransaksi({ // NOSONAR
      userId: user.id,
      jenis: data.jenis,
      nominal: data.nominal,
      keterangan: data.keterangan,
      kategori,
    });

    // Ambil saldo hari ini untuk ditampilkan
    const saldoHariIni = await getSaldoHariIni(user.id); // NOSONAR

    // Buat link ke website
    const webBase = process.env.WEB_URL;
    const webUrl = webBase ? `${webBase}/${user.publicId}/transaksi` : null;

    // Kirim konfirmasi
    const pesan_konfirmasi = pesanTransaksiBerhasil(transaksi, saldoHariIni, webUrl);
    await sock.sendMessage(sender, { text: pesan_konfirmasi });
  } catch (error) {
    console.error('Error handleCatat:', error);
    await sock.sendMessage(sender, { text: pesanErrorUmum() });
  }
}

/**
 * Handle command "hapus [id]".
 * Tahap 1: Tampilkan detail & minta konfirmasi.
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {string} pesan - Pesan lengkap (misalnya "hapus 42")
 * @param {object} user - Data user
 * @param {Map} userStates - Map state management
 */
async function handleHapus(sock, sender, pesan, user, userStates) {
  try {
    // Parse ID dari pesan
    const parts = pesan.trim().split(/\s+/);
    const idText = parts[1] || '';

    const { valid, id, error } = validasiIdTransaksi(idText);

    if (!valid) {
      await sock.sendMessage(sender, { text: error });
      return;
    }

    // Cari transaksi di database
    const trx = await getTransaksiById(id, user.id); // NOSONAR

    if (!trx) {
      await sock.sendMessage(sender, { text: pesanErrorTransaksiNotFound(id) });
      return;
    }

    // Set state konfirmasi hapus
    userStates.set(sender, {
      action: 'konfirmasi_hapus',
      data: { transaksiId: trx.id, transaksi: trx },
      expiry: Date.now() + 60000, // Expired dalam 1 menit
    });

    // Kirim pesan konfirmasi
    await sock.sendMessage(sender, { text: pesanKonfirmasiHapus(trx) });
  } catch (error) {
    console.error('Error handleHapus:', error);
    await sock.sendMessage(sender, { text: pesanErrorUmum() });
  }
}

/**
 * Handle konfirmasi hapus (saat user ketik "ya" atau "batal").
 *
 * @param {object} sock - Socket Baileys
 * @param {string} sender - Nomor WA pengirim
 * @param {string} pesan - "ya" atau "batal"
 * @param {object} user - Data user
 * @param {Map} userStates - Map state management
 * @returns {boolean} true jika state di-handle
 */
async function handleKonfirmasiHapus(sock, sender, pesan, user, userStates) {
  const state = userStates.get(sender);

  if (state?.action !== 'konfirmasi_hapus') {
    return false; // Bukan dalam state konfirmasi hapus
  }

  // Cek apakah state sudah expired
  if (Date.now() > state.expiry) {
    userStates.delete(sender);
    await sock.sendMessage(sender, { text: pesanKonfirmasiExpired() });
    return true;
  }

  const jawaban = pesan.trim().toLowerCase();

  if (jawaban === 'ya') {
    try {
      const berhasil = await hapusTransaksi(state.data.transaksiId, user.id); // NOSONAR

      if (berhasil) {
        await sock.sendMessage(sender, {
          text: pesanHapusBerhasil(state.data.transaksi),
        });
      } else {
        await sock.sendMessage(sender, {
          text: pesanErrorTransaksiNotFound(state.data.transaksiId),
        });
      }
    } catch (error) {
      console.error('Error konfirmasi hapus:', error);
      await sock.sendMessage(sender, { text: pesanErrorUmum() });
    }

    userStates.delete(sender);
    return true;
  }

  if (jawaban === 'batal' || jawaban === 'tidak' || jawaban === 'no') {
    await sock.sendMessage(sender, { text: pesanBatalHapus() });
    userStates.delete(sender);
    return true;
  }

  // Jawaban tidak dikenali saat state konfirmasi
  await sock.sendMessage(sender, { text: pesanKonfirmasiTidakDikenali() });
  return true;
}

/**
 * Handle command "bayar" — shortcut untuk catat keluar.
 * Format: bayar [nominal] [keterangan]
 * Contoh: bayar 25000 makan siang
 *
 * @param {object} sock
 * @param {string} sender
 * @param {string} pesan
 * @param {object} user
 */
async function handleBayar(sock, sender, pesan, user) {
  const parts = pesan.trim().split(/\s+/);

  // Jika hanya "bayar" tanpa argumen
  if (parts.length < 3) {
    await sock.sendMessage(sender, {
      text:
        'Format: _bayar [nominal] [keterangan]_\n\n' +
        'Contoh:\n' +
        '_bayar 25000 makan siang_\n' +
        '_bayar 50ribu tagihan listrik_',
    });
    return;
  }

  // Transform ke format parseCatat: "catat keluar [nominal] [keterangan]"
  const rest = parts.slice(1).join(' ');
  return handleCatat(sock, sender, 'catat keluar ' + rest, user);
}

module.exports = {
  handleCatat,
  handleHapus,
  handleKonfirmasiHapus,
  handleBayar,
};
