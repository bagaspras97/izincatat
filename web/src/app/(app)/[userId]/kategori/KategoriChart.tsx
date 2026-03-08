'use client';

import DoughnutChart from '@/components/charts/DoughnutChart';

interface Props {
  readonly labels: string[];
  readonly data: number[];
  readonly colors: string[];
}

/**
 * Client Component: hanya DoughnutChart yang butuh Canvas API.
 * Data di-fetch di Server Component induk lalu di-pass sebagai props.
 */
export default function KategoriChart({ labels, data, colors }: Props) {
  return <DoughnutChart labels={labels} data={data} colors={colors} />;
}
