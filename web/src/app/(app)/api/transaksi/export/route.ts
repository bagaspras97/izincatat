import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

// UTF-8 BOM — agar Excel langsung baca encoding dengan benar
const BOM = '\uFEFF';

function escapeCSV(value: string | number) {
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRows(rows: Record<string, string | number>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCSV(r[h])).join(',')),
  ];
  return lines.join('\r\n');
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n);
}

function buildFilename(params: {
  jenis?: string | null;
  kategori?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const parts = ['transaksi'];
  if (params.jenis === 'masuk')  parts.push('pemasukan');
  if (params.jenis === 'keluar') parts.push('pengeluaran');
  if (params.kategori) {
    parts.push(params.kategori.toLowerCase().replaceAll(/\s+&?\s*/g, '-').replaceAll(/[^a-z0-9-]/g, ''));
  }
  if (params.dateFrom) parts.push(params.dateFrom);
  if (params.dateTo && params.dateTo !== params.dateFrom) parts.push(`sd-${params.dateTo}`);
  if (!params.dateFrom && !params.dateTo) parts.push(new Date().toISOString().slice(0, 10));
  return `${parts.join('-')}.csv`;
}

/**
 * GET /api/transaksi/export
 * Return semua transaksi yang match filter sebagai CSV dengan:
 * - UTF-8 BOM (Excel-compatible)
 * - Nomor urut
 * - Nominal formatted Rupiah
 * - Baris summary (total pemasukan, pengeluaran, saldo) di akhir
 * - Filename dinamis berdasarkan filter aktif
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const publicId = searchParams.get('userId');
    if (!publicId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const jenis    = searchParams.get('jenis');
    const kategori = searchParams.get('kategori');
    const search   = searchParams.get('search')?.trim().toLowerCase() || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const tanggalFilter =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo   ? { lt: new Date(new Date(dateTo).getTime() + 86_400_000) } : {}),
          }
        : undefined;

    const where = {
      user: { publicId },
      ...(jenis === 'masuk' || jenis === 'keluar' ? { jenis } : {}),
      ...(kategori ? { kategori } : {}),
      ...(tanggalFilter ? { tanggal: tanggalFilter } : {}),
    };

    const rows = await prisma.transaksi.findMany({ where, orderBy: { tanggal: 'asc' } });

    let results = rows.map((t) => ({
      tanggal:    t.tanggal.toISOString().slice(0, 10),
      jenis:      t.jenis,
      nominal:    Number(t.nominal),
      keterangan: decrypt(t.keterangan),
      kategori:   t.kategori,
    }));

    if (search) {
      results = results.filter(
        (t) => t.keterangan.toLowerCase().includes(search) || t.kategori.toLowerCase().includes(search),
      );
    }

    // ── Hitung summary ────────────────────────────────────────────────────────
    const totalMasuk  = results.filter((t) => t.jenis === 'masuk').reduce((s, t) => s + t.nominal, 0);
    const totalKeluar = results.filter((t) => t.jenis === 'keluar').reduce((s, t) => s + t.nominal, 0);
    const saldo       = totalMasuk - totalKeluar;

    // ── Data rows ─────────────────────────────────────────────────────────────
    const dataRows = results.map((t, i) => ({
      'No':         i + 1,
      'Tanggal':    t.tanggal,
      'Jenis':      t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
      'Nominal':    formatRp(t.nominal),
      'Keterangan': t.keterangan,
      'Kategori':   t.kategori,
    }));

    // ── Summary rows ──────────────────────────────────────────────────────────
    const COLS = 6; // jumlah kolom
    const empty       = new Array(COLS).fill('').join(',');
    const summaryRows = [
      empty,
      `Total Pemasukan,,,${escapeCSV(formatRp(totalMasuk))},,`,
      `Total Pengeluaran,,,${escapeCSV(formatRp(totalKeluar))},,`,
      `Saldo,,,${escapeCSV(formatRp(saldo))},,`,
    ];

    const csv = [
      BOM + toRows(dataRows),
      ...summaryRows,
    ].join('\r\n');

    const filename = buildFilename({ jenis, kategori, dateFrom, dateTo });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
