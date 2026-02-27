'use client';

import '@/lib/chartSetup';
import { Doughnut } from 'react-chartjs-2';

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
}

const KATEGORI_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#E8FF57',
  'Transportasi': '#60A5FA',
  'Belanja': '#F472B6',
  'Tagihan': '#F87171',
  'Hiburan': '#A78BFA',
  'Kesehatan': '#4ADE80',
  'Pendidikan': '#FBBF24',
  'Gaji': '#34D399',
  'Transfer': '#38BDF8',
  'Lainnya': '#666666',
};

export function getKategoriColor(kategori: string): string {
  return KATEGORI_COLORS[kategori] || '#666666';
}

export default function DoughnutChart({ labels, data, colors }: DoughnutChartProps) {
  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12,
              color: '#A0A0A0',
              font: { size: 11 },
            },
          },
        },
      }}
    />
  );
}
