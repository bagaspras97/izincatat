'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend
);

// Disable semua default — bento style minimal
ChartJS.defaults.color = '#A0A0A0';
ChartJS.defaults.borderColor = '#1E1E1E';
ChartJS.defaults.font.family = 'system-ui, -apple-system, sans-serif';

export default ChartJS;
