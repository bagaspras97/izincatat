'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import {
  Users, Receipt, Settings, LogOut, Search, Plus, Pencil, Trash2,
  Check, X, Shield, Menu, UserCheck, Crown, Heart, TrendingUp,
  ChevronRight, Hash, CalendarDays, Loader2,
} from 'lucide-react';

const TIERS = ['GRATIS', 'PRO', 'COUPLE'] as const;
type Tier = (typeof TIERS)[number];
type Tab = 'users' | 'pengeluaran' | 'settings';

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

interface DevExpense {
  id: number;
  nama: string;
  harga: number;
  tanggal: string;
  createdAt: string;
}

const TIER_BADGE: Record<Tier, string> = {
  GRATIS: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  PRO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  COUPLE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

const NAV_ITEMS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export default function AdminPage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Restore session dari sessionStorage saat mount
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_secret');
    if (!saved) { setInitializing(false); return; }
    setSecret(saved);
    // Verifikasi secret masih valid
    fetch('/api/admin/users', { headers: { 'x-admin-secret': saved } })
      .then(async (res) => {
        if (!res.ok) { sessionStorage.removeItem('admin_secret'); return; }
        setUsers(await res.json());
        setAuthed(true);
        await Promise.all([fetchPricing(saved), fetchExpenses(saved)]);
      })
      .catch(() => sessionStorage.removeItem('admin_secret'))
      .finally(() => setInitializing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Users state ───
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editTier, setEditTier] = useState<Tier>('GRATIS');
  const [editExpiry, setEditExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // ─── Settings state ───
  const [hargaPro, setHargaPro] = useState(15000);
  const [hargaCouple, setHargaCouple] = useState(29000);
  const [savingPricing, setSavingPricing] = useState(false);
  const [priceMsg, setPriceMsg] = useState('');

  // ─── Pengeluaran dev state ───
  const [expenses, setExpenses] = useState<DevExpense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newHarga, setNewHarga] = useState('');
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<number | null>(null);
  const [editExpNama, setEditExpNama] = useState('');
  const [editExpHarga, setEditExpHarga] = useState('');
  const [editExpTanggal, setEditExpTanggal] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // ─── Fetchers ───
  const fetchPricing = useCallback(async (s: string) => {
    const res = await fetch('/api/admin/settings', { headers: { 'x-admin-secret': s } });
    if (res.ok) {
      const d = await res.json();
      setHargaPro(d.harga_pro);
      setHargaCouple(d.harga_couple);
    }
  }, []);

  const fetchUsers = useCallback(async (s: string) => {
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-secret': s } });
    if (!res.ok) return;
    setUsers(await res.json());
  }, []);

  const fetchExpenses = useCallback(async (s: string) => {
    setExpenseLoading(true);
    try {
      const res = await fetch('/api/admin/expenses', { headers: { 'x-admin-secret': s } });
      if (res.ok) {
        const d = await res.json();
        setExpenses(d.items);
      }
    } finally {
      setExpenseLoading(false);
    }
  }, []);

  // ─── Login ───
  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-secret': secret } });
      if (res.status === 401) { setError('Secret salah.'); return; }
      if (!res.ok) { setError('Gagal ambil data.'); return; }
      setUsers(await res.json());
      setAuthed(true);
      sessionStorage.setItem('admin_secret', secret);
      await Promise.all([fetchPricing(secret), fetchExpenses(secret)]);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
    if (tab === 'pengeluaran' && expenses.length === 0) fetchExpenses(secret);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_secret');
    setAuthed(false);
    setSecret('');
    setUsers([]);
    setExpenses([]);
    setActiveTab('users');
    router.push('/');
  };

  // ─── Users CRUD ───
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
        body: JSON.stringify({ userId, tier: editTier, tierExpiry: editExpiry || null }),
      });
      if (!res.ok) { alert('Gagal simpan.'); return; }
      setEditing(null);
      await fetchUsers(secret);
    } finally {
      setSaving(false);
    }
  };

  // ─── Settings ───
  const savePricing = async () => {
    setSavingPricing(true);
    setPriceMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ harga_pro: hargaPro, harga_couple: hargaCouple }),
      });
      setPriceMsg(res.ok ? 'Tersimpan!' : 'Gagal menyimpan.');
      setTimeout(() => setPriceMsg(''), 3000);
    } finally {
      setSavingPricing(false);
    }
  };

  // ─── Pengeluaran CRUD ───
  const addExpense = async () => {
    if (!newNama.trim() || !newHarga) return;
    setAddingExpense(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ nama: newNama.trim(), harga: Number(newHarga), tanggal: newTanggal }),
      });
      if (res.ok) {
        setNewNama('');
        setNewHarga('');
        setNewTanggal(new Date().toISOString().slice(0, 10));
        await fetchExpenses(secret);
      }
    } finally {
      setAddingExpense(false);
    }
  };

  const startEditExpense = (exp: DevExpense) => {
    setEditingExpense(exp.id);
    setEditExpNama(exp.nama);
    setEditExpHarga(String(exp.harga));
    setEditExpTanggal(exp.tanggal.slice(0, 10));
  };

  const saveEditExpense = async (id: number) => {
    setSavingExpense(true);
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ nama: editExpNama.trim(), harga: Number(editExpHarga), tanggal: editExpTanggal }),
      });
      if (res.ok) {
        setEditingExpense(null);
        await fetchExpenses(secret);
      }
    } finally {
      setSavingExpense(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    await fetch(`/api/admin/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
    await fetchExpenses(secret);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.harga, 0);
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nomorWa.includes(q) ||
      (u.nama?.toLowerCase().includes(q) ?? false) ||
      u.tier.toLowerCase().includes(q)
    );
  });

  // ─── Stats ───
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newThisMonth = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    return {
      total: users.length,
      gratis: users.filter((u) => u.tier === 'GRATIS').length,
      pro: users.filter((u) => u.tier === 'PRO').length,
      couple: users.filter((u) => u.tier === 'COUPLE').length,
      newThisMonth,
    };
  }, [users]);

  // ═══════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════════════════
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <form
          onSubmit={handleLogin}
          className="bg-bg-card border border-border-card rounded-2xl p-8 w-full max-w-sm shadow-sm space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent-dim flex items-center justify-center">
              <Shield size={22} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Admin Panel</h1>
              <p className="text-xs text-text-muted">Izin Catat</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted">Admin Secret</label>
            <input
              type="password"
              placeholder="Masukkan secret..."
              className="w-full px-4 py-2.5 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent transition-colors"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 px-3 py-2 rounded-xl">
              <X size={14} />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !secret}
            className="w-full py-2.5 rounded-xl bg-accent text-bg-primary font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                Masuk
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Mobile hamburger ─── */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-bg-card border border-border-card lg:hidden"
        >
          <Menu size={20} className="text-text-primary" />
        </button>
      )}

      {/* ─── Mobile overlay ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-18 bg-bg-card border-r border-border-card
          flex flex-col items-center py-4 gap-2 z-40
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-all lg:hidden mb-2"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="mb-2 hidden lg:flex items-center justify-center">
          <Logo size={28} className="rounded-lg" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                title={item.label}
                className={`
                  relative w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-150 group cursor-pointer
                  ${activeTab === item.id
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
                  }
                `}
              >
                <Icon size={20} />
                {/* Tooltip (desktop) */}
                <span className="
                  hidden lg:block
                  absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-bg-card border border-border-card text-text-primary
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity whitespace-nowrap shadow-sm
                ">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 items-center">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-card text-text-muted hover:text-danger hover:border-danger/40 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="lg:ml-18 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pt-16 lg:pt-6 space-y-6">

          {/* ═══════════════════════════════════════ */}
          {/* TAB: USERS                              */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'users' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Manajemen User</h2>
                  <p className="text-sm text-text-muted mt-0.5">{users.length} user terdaftar</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Cari nomor / nama / tier..."
                    className="pl-9 pr-4 py-2 rounded-xl border border-border-card bg-bg-card text-text-primary text-sm outline-none focus:border-accent w-64 transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Users size={14} />
                    <span className="text-xs font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserCheck size={14} />
                    <span className="text-xs font-medium">Gratis</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.gratis}</p>
                </div>
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Crown size={14} />
                    <span className="text-xs font-medium">PRO</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.pro}</p>
                </div>
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-pink-500">
                    <Heart size={14} />
                    <span className="text-xs font-medium">Couple</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.couple}</p>
                </div>
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-accent">
                    <TrendingUp size={14} />
                    <span className="text-xs font-medium">Baru (bulan ini)</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.newThisMonth}</p>
                </div>
              </div>

              {/* Users table */}
              <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-card-hover/50">
                        <th className="text-left px-4 py-3 font-medium text-text-muted">Nama / Nomor</th>
                        <th className="text-left px-4 py-3 font-medium text-text-muted">Tier</th>
                        <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">Expiry</th>
                        <th className="text-center px-4 py-3 font-medium text-text-muted hidden sm:table-cell">Tx Bulan</th>
                        <th className="text-center px-4 py-3 font-medium text-text-muted hidden sm:table-cell">Tx Total</th>
                        <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Daftar</th>
                        <th className="px-4 py-3 w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-text-primary">{u.nama ?? '—'}</p>
                            <p className="text-text-muted text-xs font-mono">{u.nomorWa}</p>
                          </td>
                          <td className="px-4 py-3">
                            {editing === u.id ? (
                              <select
                                value={editTier}
                                onChange={(e) => setEditTier(e.target.value as Tier)}
                                className="px-2 py-1.5 rounded-lg border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent"
                              >
                                {TIERS.map((t) => <option key={t}>{t}</option>)}
                              </select>
                            ) : (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGE[u.tier]}`}>
                                {u.tier}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                            {editing === u.id ? (
                              <input
                                type="date"
                                value={editExpiry}
                                onChange={(e) => setEditExpiry(e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent"
                              />
                            ) : (
                              u.tierExpiry
                                ? new Date(u.tierExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-text-primary hidden sm:table-cell">
                            <span className={u.txBulanIni >= 50 && u.tier === 'GRATIS' ? 'text-danger font-semibold' : ''}>
                              {u.txBulanIni}
                              {u.tier === 'GRATIS' && <span className="text-text-muted">/50</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-text-secondary hidden sm:table-cell">{u.txTotal}</td>
                          <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                            {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            {editing === u.id ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => saveEdit(u.id)}
                                  disabled={saving}
                                  className="p-1.5 rounded-lg bg-accent text-bg-primary disabled:opacity-50 transition-opacity"
                                  title="Simpan"
                                >
                                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button
                                  onClick={() => setEditing(null)}
                                  className="p-1.5 rounded-lg border border-border-card text-text-muted hover:text-text-primary transition-colors"
                                  title="Batal"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(u)}
                                className="p-1.5 rounded-lg border border-border-card text-text-muted hover:border-accent hover:text-accent transition-colors"
                                title="Edit user"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                            <p>{search ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: PENGELUARAN DEV                    */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'pengeluaran' && (
            <>
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-text-primary">Pengeluaran Pengembangan</h2>
                <p className="text-sm text-text-muted mt-0.5">Rekap biaya untuk membangun dan menjalankan Izin Catat.</p>
              </div>

              {/* Summary + Add form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total card */}
                <div className="bg-bg-card border border-border-card rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Receipt size={14} />
                    <span className="text-xs font-medium">Total Pengeluaran</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{formatRp(totalExpenses)}</p>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Hash size={12} />
                    <span>{expenses.length} item tercatat</span>
                  </div>
                </div>

                {/* Add form */}
                <div className="bg-bg-card border border-border-card rounded-2xl p-5 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={16} className="text-accent" />
                    <p className="text-sm font-semibold text-text-primary">Tambah Pengeluaran</p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-36 space-y-1">
                      <label className="text-xs text-text-muted font-medium">Nama</label>
                      <input
                        type="text"
                        placeholder="cth: Domain .com"
                        value={newNama}
                        onChange={(e) => setNewNama(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                        className="w-full px-3 py-2 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <div className="w-36 space-y-1">
                      <label className="text-xs text-text-muted font-medium">Harga (Rp)</label>
                      <input
                        type="number"
                        placeholder="120000"
                        min={0}
                        value={newHarga}
                        onChange={(e) => setNewHarga(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <div className="w-40 space-y-1">
                      <label className="text-xs text-text-muted font-medium">Tanggal</label>
                      <input
                        type="date"
                        value={newTanggal}
                        onChange={(e) => setNewTanggal(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <button
                      onClick={addExpense}
                      disabled={addingExpense || !newNama.trim() || !newHarga}
                      className="px-5 py-2 rounded-xl bg-accent text-bg-primary text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-opacity self-end"
                    >
                      {addingExpense ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Expenses table */}
              <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
                {expenseLoading ? (
                  <div className="py-16 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin opacity-50" />
                    <span>Memuat data...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle bg-bg-card-hover/50">
                          <th className="text-left px-4 py-3 font-medium text-text-muted">Nama</th>
                          <th className="text-right px-4 py-3 font-medium text-text-muted">Harga</th>
                          <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">Tanggal</th>
                          <th className="px-4 py-3 w-28"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors"
                          >
                            <td className="px-4 py-3">
                              {editingExpense === e.id ? (
                                <input
                                  type="text"
                                  value={editExpNama}
                                  onChange={(ev) => setEditExpNama(ev.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent w-full"
                                />
                              ) : (
                                <span className="font-medium text-text-primary">{e.nama}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {editingExpense === e.id ? (
                                <input
                                  type="number"
                                  value={editExpHarga}
                                  onChange={(ev) => setEditExpHarga(ev.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent w-36 text-right"
                                />
                              ) : (
                                <span className="font-mono text-text-primary">{formatRp(e.harga)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                              {editingExpense === e.id ? (
                                <input
                                  type="date"
                                  value={editExpTanggal}
                                  onChange={(ev) => setEditExpTanggal(ev.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent"
                                />
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <CalendarDays size={13} className="text-text-muted" />
                                  {new Date(e.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingExpense === e.id ? (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => saveEditExpense(e.id)}
                                    disabled={savingExpense}
                                    className="p-1.5 rounded-lg bg-accent text-bg-primary disabled:opacity-50 transition-opacity"
                                    title="Simpan"
                                  >
                                    {savingExpense ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  </button>
                                  <button
                                    onClick={() => setEditingExpense(null)}
                                    className="p-1.5 rounded-lg border border-border-card text-text-muted hover:text-text-primary transition-colors"
                                    title="Batal"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => startEditExpense(e)}
                                    className="p-1.5 rounded-lg border border-border-card text-text-muted hover:border-accent hover:text-accent transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteExpense(e.id)}
                                    className="p-1.5 rounded-lg border border-border-card text-text-muted hover:border-danger hover:text-danger transition-colors"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {expenses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                              <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                              <p>Belum ada pengeluaran tercatat.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {expenses.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-border-card bg-bg-card-hover/50">
                            <td className="px-4 py-3 text-sm font-semibold text-text-primary">Total</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-text-primary font-mono">
                              {formatRp(totalExpenses)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: SETTINGS                           */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <>
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-text-primary">Pengaturan</h2>
                <p className="text-sm text-text-muted mt-0.5">Konfigurasi yang tampil di landing page.</p>
              </div>

              {/* Pricing card */}
              <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm max-w-lg space-y-6">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-accent" />
                  <p className="text-sm font-semibold text-text-primary">Harga Tier</p>
                </div>

                <div className="space-y-5">
                  {/* PRO pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-600" />
                      <label className="text-sm font-medium text-text-primary">Harga PRO</label>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={hargaPro}
                      onChange={(e) => setHargaPro(Number(e.target.value))}
                      className="px-3 py-2.5 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent w-full transition-colors"
                    />
                    <p className="text-xs text-text-muted">
                      Tampil di landing: <span className="font-medium text-text-secondary">{hargaPro >= 1_000_000 ? `${Math.round(hargaPro / 1_000_000)}jt` : hargaPro >= 1_000 ? `${Math.round(hargaPro / 1_000)}rb` : String(hargaPro)}/bulan</span>
                    </p>
                  </div>

                  {/* COUPLE pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-pink-500" />
                      <label className="text-sm font-medium text-text-primary">Harga COUPLE</label>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={hargaCouple}
                      onChange={(e) => setHargaCouple(Number(e.target.value))}
                      className="px-3 py-2.5 rounded-xl border border-border-card bg-bg-primary text-text-primary text-sm outline-none focus:border-accent w-full transition-colors"
                    />
                    <p className="text-xs text-text-muted">
                      Tampil di landing: <span className="font-medium text-text-secondary">{hargaCouple >= 1_000_000 ? `${Math.round(hargaCouple / 1_000_000)}jt` : hargaCouple >= 1_000 ? `${Math.round(hargaCouple / 1_000)}rb` : String(hargaCouple)}/bulan</span>
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
                  <button
                    onClick={savePricing}
                    disabled={savingPricing}
                    className="px-5 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-opacity"
                  >
                    {savingPricing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {savingPricing ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  {priceMsg && (
                    <span className={`text-sm font-medium ${priceMsg.includes('Tersimpan') ? 'text-success' : 'text-danger'}`}>
                      {priceMsg}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
