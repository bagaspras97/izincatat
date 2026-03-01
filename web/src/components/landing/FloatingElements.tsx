'use client';

import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  CreditCard,
  BadgeDollarSign,
  ChartBar,
  Calculator,
  Coins,
  ShieldCheck,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const icons = [
  Wallet, Receipt, PiggyBank, TrendingUp, CreditCard,
  BadgeDollarSign, ChartBar, Calculator, Coins, ShieldCheck,
  MessageSquare, Mic,
];

interface FloatingIcon {
  id: number;
  Icon: typeof Wallet;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  reverse: boolean;
}

export function FloatingElements() {
  const [items, setItems] = useState<FloatingIcon[]>([]);

  useEffect(() => {
    const generated: FloatingIcon[] = icons.map((Icon, i) => ({
      id: i,
      Icon,
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 10,
      size: Math.random() * 16 + 20,
      duration: Math.random() * 6 + 7,
      delay: Math.random() * -8,
      reverse: i % 2 === 0,
    }));
    setItems(generated);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {items.map(({ id, Icon, x, y, size, duration, delay, reverse }) => (
        <div
          key={id}
          className={reverse ? 'float-icon-reverse' : 'float-icon'}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon size={size} className="text-accent" />
        </div>
      ))}
    </div>
  );
}
