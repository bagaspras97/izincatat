'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { segment: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { segment: 'transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { segment: 'laporan', label: 'Laporan', icon: BarChart3 },
  { segment: 'kategori', label: 'Kategori', icon: PieChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ekstrak userId (publicId) dari path — format: /[userId]/[segment]
  const pathParts = pathname.split('/').filter(Boolean);
  const userId = pathParts[0] && pathParts[0] !== 'api' ? pathParts[0] : null;

  const navItems = userId
    ? NAV_ITEMS.map((item) => ({
        href: `/${userId}/${item.segment}`,
        label: item.label,
        icon: item.icon,
        isActive: pathParts[1] === item.segment,
      }))
    : [];

  return (
    <>
      {/* Hamburger — hanya muncul saat sidebar tertutup di mobile */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-bg-card border border-border-card lg:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-[72px] bg-bg-card border-r border-border-card
          flex flex-col items-center py-4 gap-2 z-40
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Tombol close — hanya di mobile, di dalam sidebar */}
        <button
          onClick={() => setMobileOpen(false)}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-all lg:hidden mb-2"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="hidden lg:flex w-11 h-11 items-center justify-center mb-2">
          <Logo size={36} className="rounded-xl" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                title={item.label}
                className={`
                  relative w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-150 group
                  ${item.isActive
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
                  }
                `}
              >
                <Icon size={20} />
                {/* Tooltip — hanya desktop */}
                <span className="
                  hidden lg:block
                  absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-bg-card border border-border-card text-text-primary
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity whitespace-nowrap
                ">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <ThemeToggle />
      </aside>
    </>
  );
}
