'use client';

import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  type: 'user' | 'bot';
  content: React.ReactNode;
}

const messages: ChatMessage[] = [
  {
    type: 'user',
    content: 'catat makan siang 35rb',
  },
  {
    type: 'bot',
    content: (
      <div className="space-y-1">
        <p>✅ <span className="font-semibold">Izin mencatat!</span></p>
        <p className="text-text-muted">Pengeluaran: makan siang</p>
        <p className="text-text-muted">Nominal: <span className="text-danger font-medium">-Rp35.000</span></p>
        <p className="text-text-muted">Kategori: <span className="text-text-secondary">Makanan 🍽️</span></p>
      </div>
    ),
  },
  {
    type: 'user',
    content: 'berapa saldo gue sekarang?',
  },
  {
    type: 'bot',
    content: (
      <div>
        <p>Izin melaporkan saldo Kakak 🙏</p>
        <p className="mt-1">💰 <span className="text-accent font-semibold">Rp2.465.000</span></p>
        <p className="text-text-muted text-xs mt-1">Masuk Rp5.000.000 · Keluar Rp2.535.000</p>
      </div>
    ),
  },
];

export function AnimatedChat() {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          // Reveal messages one by one
          let count = 0;
          const interval = setInterval(() => {
            count++;
            setVisibleCount(count);
            if (count >= messages.length) clearInterval(interval);
          }, 700);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="max-w-xl mx-auto">
      <div className="glow-card !rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 min-h-[280px]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-full bg-accent-dim flex items-center justify-center">
            <span className="text-accent text-sm font-bold">IC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Izin Catat</p>
            <p className="text-xs text-accent">Online</p>
          </div>
        </div>

        {messages.map((msg, i) => {
          if (i >= visibleCount) return null;
          return (
            <div
              key={i}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`text-sm px-4 py-2.5 max-w-[85%] ${
                  msg.type === 'user'
                    ? 'bg-[#005C4B] text-white rounded-2xl rounded-br-md chat-bubble-user'
                    : 'bg-bg-card-hover border border-border-subtle text-text-primary rounded-2xl rounded-bl-md chat-bubble-bot'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {visibleCount === 0 && (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Menunggu pesan...</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-text-muted text-xs mt-4 tracking-wide">
        Semua itu cukup dari chat WhatsApp biasa.
      </p>
    </div>
  );
}
