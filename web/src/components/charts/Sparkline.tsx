'use client';

import '@/lib/chartSetup';
import { Line } from 'react-chartjs-2';

interface SparklineProps {
  data: number[];
  color?: string;
}

export default function Sparkline({ data, color = '#E8FF57' }: SparklineProps) {
  return (
    <div className="h-[40px] w-full">
      <Line
        data={{
          labels: data.map((_, i) => i.toString()),
          datasets: [
            {
              data,
              borderColor: color,
              borderWidth: 1.5,
              pointRadius: 0,
              fill: true,
              backgroundColor: `${color}15`,
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
      />
    </div>
  );
}
