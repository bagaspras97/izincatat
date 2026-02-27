'use client';

import '@/lib/chartSetup';
import { Bar } from 'react-chartjs-2';

interface BarChartProps {
  labels: string[];
  masuk: number[];
  keluar: number[];
}

export default function BarChart({ labels, masuk, keluar }: BarChartProps) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Pemasukan',
            data: masuk,
            backgroundColor: '#E8FF57',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Pengeluaran',
            data: keluar,
            backgroundColor: '#F87171',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            align: 'end' as const,
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              color: '#A0A0A0',
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#666666', font: { size: 11 } },
          },
          y: {
            grid: { color: '#1E1E1E' },
            ticks: {
              color: '#666666',
              font: { size: 11 },
              callback: (value) => {
                const num = Number(value);
                if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}jt`;
                if (num >= 1_000) return `${(num / 1_000).toFixed(0)}rb`;
                return num.toString();
              },
            },
          },
        },
      }}
    />
  );
}
