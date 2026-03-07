'use client';

import { useState, useCallback } from 'react';

const TIERS = ['GRATIS', 'PRO', 'COUPLE'] as const;
type Tier = (typeof TIERS)[number];

interface User {
  id: number;
  publicId: string;
  nomorWa: string;
  nama: string | null;
  tier: Tier;
  tierExpiry: string | null;
  isActive: boolean;
  createdAt: string;
  txTotal: number;
  txBulanIni: number;
}

const TIER_BADGE: Record<Tier, string> = {
  GRATIS: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  PRO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  COUPLE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

export default function AdminUsersPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editTier, setEditTier] = useState<Tier>('GRATIS');
  const [editExpiry, setEditExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-secret': s },
      });
      if (res.status === 401) { setError('Secret salah.'); return; }
      if (!res.ok) { setError('Gagal ambil data.'); return; }
      setUsers(await res.json());
      setAuthed(true);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchUsers(secret);
  };

  const startEdit = (u: User) => {
    setEditing(u.id);
    setEditTier(u.tier);
    setEditExpiry(u.tierExpiry ? u.tierExpiry.slice(0, 10) : '');
  };

  const saveEdit = async (userId: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          userId,
          tier: editTier,
          tierExpiry: editExpiry || null,
        }),
      });
      if (!res.ok) { alert('Gagal simpan.'); return; }
      setEditing(null);
      fetchUsers(secret);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nomorWa.includes(q) ||
      (u.nama?.toLowerCase().includes(q) ?? false) ||
      u.tier.toLowerCase().includes(q)
    );
  });

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <form onSubmit={handleLogin} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 w-full max-w-sm shadow-sm space-y-4">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">🔐 Admin Izin Catat</h1>
          <input
            type="password"
            placeholder="Admin secret..."
            className="w-full px-4 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-[var(--accent)] text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">👥 Manajemen User</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{users.length} user terdaftar</p>
          </div>
          <input
            type="text"
            placeholder="Cari nomor / nama / tier..."
            className="px-4 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="text-left px-4 py-3 font-medium">Nama / Nomor</th>
                  <th className="text-left px-4 py-3 font-medium">Tier</th>
                  <th className="text-left px-4 py-3 font-medium">Expiry</th>
                  <th className="text-center px-4 py-3 font-medium">Tx Bulan</th>
                  <th className="text-center px-4 py-3 font-medium">Tx Total</th>
                  <th className="text-left px-4 py-3 font-medium">Daftar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{u.nama ?? '—'}</p>
                      <p className="text-[var(--text-muted)] text-xs">{u.nomorWa}</p>
                    </td>

                    {/* Tier — mode edit atau tampil */}
                    <td className="px-4 py-3">
                      {editing === u.id ? (
                        <select
                          value={editTier}
                          onChange={(e) => setEditTier(e.target.value as Tier)}
                          className="px-2 py-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm outline-none"
                        >
                          {TIERS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE[u.tier]}`}>
                          {u.tier}
                        </span>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {editing === u.id ? (
                        <input
                          type="date"
                          value={editExpiry}
                          onChange={(e) => setEditExpiry(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm outline-none"
                        />
                      ) : (
                        u.tierExpiry
                          ? new Date(u.tierExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center text-[var(--text-primary)]">
                      <span className={u.txBulanIni >= 50 && u.tier === 'GRATIS' ? 'text-red-500 font-semibold' : ''}>
                        {u.txBulanIni}
                        {u.tier === 'GRATIS' && <span className="text-[var(--text-muted)]">/50</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{u.txTotal}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      {editing === u.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(u.id)}
                            disabled={saving}
                            className="px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-50"
                          >
                            {saving ? '...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="px-3 py-1 rounded-lg border border-[var(--border-card)] text-[var(--text-secondary)] text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(u)}
                          className="px-3 py-1 rounded-lg border border-[var(--border-card)] text-[var(--text-secondary)] text-xs hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      {search ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
