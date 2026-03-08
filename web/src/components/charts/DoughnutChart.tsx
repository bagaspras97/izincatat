'use client';

import '@/lib/chartSetup';
import { Doughnut } from 'react-chartjs-2';
// Re-export agar import lama tidak perlu diubah
export { getKategoriColor } from '@/lib/kategoriColor';

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
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
