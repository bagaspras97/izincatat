/**
 * Grafik Service — Izin Catat
 * Generate grafik pie chart menggunakan @napi-rs/canvas + chart.js.
 * Tidak perlu Visual Studio / native build tools.
 */

const { createCanvas } = require('@napi-rs/canvas');
const { Chart, ArcElement, PieController, Legend, Title, Tooltip } = require('chart.js');

// Register komponen chart.js yang dibutuhkan
Chart.register(ArcElement, PieController, Legend, Title, Tooltip);

// Ukuran canvas
const WIDTH = 800;
const HEIGHT = 600;

// Warna untuk setiap kategori
const WARNA_KATEGORI = {
  'Makanan & Minuman': '#FF6B6B',
  'Transportasi': '#4ECDC4',
  'Belanja Online': '#45B7D1',
  'Tagihan': '#FFA07A',
  'Pendapatan': '#98D8C8',
  'Hiburan': '#DDA0DD',
  'Kesehatan': '#87CEEB',
  'Lain-lain': '#C3B1E1',
};

const WARNA_DEFAULT = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#DDA0DD', '#87CEEB', '#C3B1E1',
  '#F7DC6F', '#82E0AA', '#F0B27A', '#85C1E9',
];

/**
 * Generate pie chart dari breakdown pengeluaran per kategori.
 * @param {Array<{kategori: string, total: number}>} breakdown
 * @param {string} labelPeriode - Label periode untuk judul
 * @returns {Buffer} Buffer gambar PNG
 */
async function generatePieChart(breakdown, labelPeriode) {
  if (!breakdown || breakdown.length === 0) {
    return generateEmptyChart(labelPeriode);
  }

  const labels = breakdown.map((item) => item.kategori);
  const values = breakdown.map((item) => item.total);
  const total = values.reduce((a, b) => a + b, 0);

  // Ambil warna sesuai kategori
  const colors = labels.map((label, index) => {
    return WARNA_KATEGORI[label] || WARNA_DEFAULT[index % WARNA_DEFAULT.length];
  });

  // Buat canvas dengan @napi-rs/canvas
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gelap
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Legend labels dengan nominal
  const legendLabels = labels.map((label, i) => {
    const persen = ((values[i] / total) * 100).toFixed(1);
    const nominal = values[i].toLocaleString('id-ID');
    return `${label}: Rp ${nominal} (${persen}%)`;
  });

  // Buat chart
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: legendLabels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#1a1a2e',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      layout: { padding: { top: 10, bottom: 20, left: 10, right: 10 } },
      plugins: {
        title: {
          display: true,
          text: `Pengeluaran per Kategori — ${labelPeriode}`,
          color: '#ffffff',
          font: { size: 18, weight: 'bold' },
          padding: { top: 10, bottom: 20 },
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff',
            font: { size: 12 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: { enabled: false },
      },
    },
  });

  // Render ke buffer PNG
  const buffer = canvas.toBuffer('image/png');

  // Destroy chart untuk bebaskan memory
  chart.destroy();

  console.log(`📊 Pie chart berhasil di-generate: ${labelPeriode}`);
  return buffer;
}

/**
 * Generate gambar placeholder jika belum ada data pengeluaran.
 * @param {string} labelPeriode
 * @returns {Buffer}
 */
async function generateEmptyChart(labelPeriode) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Belum ada data pengeluaran'],
      datasets: [{
        data: [1],
        backgroundColor: ['#3d3d5c'],
        borderColor: '#1a1a2e',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: `Pengeluaran per Kategori — ${labelPeriode}`,
          color: '#ffffff',
          font: { size: 18, weight: 'bold' },
        },
        legend: {
          labels: { color: '#888888', font: { size: 14 } },
        },
        tooltip: { enabled: false },
      },
    },
  });

  const buffer = canvas.toBuffer('image/png');
  chart.destroy();
  return buffer;
}

module.exports = {
  generatePieChart,
};
