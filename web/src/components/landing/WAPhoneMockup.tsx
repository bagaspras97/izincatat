'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, Video, MoreVertical, Mic, CheckCheck, Smile, Paperclip } from 'lucide-react';

const WA_DARK_GREEN = '#075E54';
const WA_LIGHT_GREEN = '#00A884';
const WA_BUBBLE_OUT = '#DCF8C6';
const WA_BG = '#E5DDD5';

type Msg = {
  from: 'user' | 'bot';
  content: React.ReactNode;
  time: string;
};

const MESSAGES: Msg[] = [
  {
    from: 'user',
    content: 'catat keluar bensin 50rb',
    time: '20.14',
  },
  {
    from: 'bot',
    content: (
      <div className="leading-relaxed">
        <p>✅ <span className="font-semibold">Izin mencatat!</span></p>
        <p style={{ color: '#667781', fontSize: 11 }}>Pengeluaran · Bensin ⛽</p>
        <p className="font-semibold" style={{ color: '#E53935' }}>-Rp50.000</p>
      </div>
    ),
    time: '20.14',
  },
  {
    from: 'user',
    content: 'saldo',
    time: '20.15',
  },
  {
    from: 'bot',
    content: (
      <div className="leading-relaxed">
        <p>Izin melaporkan 🙏</p>
        <p className="font-bold" style={{ color: '#00A884', marginTop: 2 }}>💰 Rp2.465.000</p>
        <p style={{ color: '#667781', fontSize: 10, marginTop: 1 }}>Masuk Rp5jt · Keluar Rp2,5jt</p>
      </div>
    ),
    time: '20.15',
  },
  {
    from: 'user',
    content: 'laporan bulan ini',
    time: '20.16',
  },
  {
    from: 'bot',
    content: (
      <div className="leading-relaxed">
        <p>📊 <span className="font-semibold">Laporan April 2026</span></p>
        <p style={{ color: '#667781', fontSize: 11, marginTop: 2 }}>Masuk &nbsp;→ Rp5.000.000</p>
        <p style={{ color: '#667781', fontSize: 11 }}>Keluar → Rp2.535.000</p>
        <p className="font-semibold" style={{ color: '#00A884', marginTop: 2 }}>Sisa Rp2.465.000 ✨</p>
      </div>
    ),
    time: '20.16',
  },
];

export function WAPhoneMockup() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];

    function run() {
      ts.length = 0;
      setVisible(0);
      setTyping(false);

      let delay = 700;

      MESSAGES.forEach((msg, i) => {
        if (msg.from === 'bot') {
          ts.push(setTimeout(() => setTyping(true), delay));
          delay += 900;
          ts.push(setTimeout(() => {
            setTyping(false);
            setVisible(i + 1);
          }, delay));
          delay += 1400;
        } else {
          ts.push(setTimeout(() => setVisible(i + 1), delay));
          delay += 1000;
        }
      });

      ts.push(setTimeout(run, delay + 2500));
    }

    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visible, typing]);

  return (
    <div className="relative mx-auto select-none" style={{ width: 252 }}>
      {/* Glow behind phone */}
      <div
        className="absolute inset-0 blur-2xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #7EC843 0%, transparent 70%)' }}
      />

      {/* Phone frame */}
      <div
        className="relative rounded-[44px] p-[11px]"
        style={{
          background: 'linear-gradient(160deg, #2e2e2e 0%, #141414 100%)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
        }}
      >
        {/* Physical buttons */}
        <div className="absolute rounded-l-full" style={{ left: -3, top: 88, width: 3, height: 28, background: '#3a3a3a' }} />
        <div className="absolute rounded-l-full" style={{ left: -3, top: 126, width: 3, height: 40, background: '#3a3a3a' }} />
        <div className="absolute rounded-l-full" style={{ left: -3, top: 174, width: 3, height: 40, background: '#3a3a3a' }} />
        <div className="absolute rounded-r-full" style={{ right: -3, top: 144, width: 3, height: 56, background: '#3a3a3a' }} />

        {/* Screen */}
        <div
          className="rounded-[34px] overflow-hidden flex flex-col"
          style={{ height: 510, background: WA_BG }}
        >
          {/* Status bar */}
          <div
            className="flex items-center justify-between px-5 pt-3 pb-1 relative"
            style={{ background: WA_DARK_GREEN }}
          >
            <span className="text-white font-semibold" style={{ fontSize: 11 }}>9:41</span>
            {/* Dynamic island */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-[10px] bg-black rounded-full"
              style={{ width: 62, height: 19 }}
            />
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <div className="flex items-end gap-[2px]">
                {[3, 5, 7, 9].map((h, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[1px]"
                    style={{ width: 2.5, height: h }}
                  />
                ))}
              </div>
              {/* WiFi icon */}
              <svg width="13" height="10" viewBox="0 0 20 14" fill="white" opacity="0.9">
                <path d="M10 11.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm7.07-4.93C15.2 4.7 12.72 3.5 10 3.5S4.8 4.7 2.93 6.57L1.5 5.14C3.74 2.9 6.72 1.5 10 1.5s6.26 1.4 8.5 3.64l-1.43 1.43zm-2.83 2.83C13.07 8.23 11.61 7.5 10 7.5s-3.07.73-4.24 1.9L4.33 8C5.86 6.47 8.84 5.5 10 5.5s4.14.97 5.67 2.5l-1.43 1.4z"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[1px]">
                <div
                  className="relative rounded-[2px] border"
                  style={{ width: 20, height: 10, borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  <div className="absolute rounded-[1px] bg-white" style={{ inset: 1.5 }} />
                </div>
                <div className="rounded-r-sm bg-white/60" style={{ width: 2, height: 5 }} />
              </div>
            </div>
          </div>

          {/* WA Header */}
          <div
            className="flex items-center gap-2 px-2.5 pb-2.5 pt-1"
            style={{ background: WA_DARK_GREEN }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ background: '#DFE5E7', color: WA_DARK_GREEN, fontSize: 11 }}
            >
              IC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold leading-none" style={{ fontSize: 13 }}>Izin Catat</p>
              <p style={{ color: '#b2dfdb', fontSize: 11, marginTop: 2 }}>online</p>
            </div>
            <div className="flex items-center gap-3">
              <Video size={17} color="white" opacity={0.9} />
              <Phone size={15} color="white" opacity={0.9} />
              <MoreVertical size={17} color="white" opacity={0.9} />
            </div>
          </div>

          {/* Chat area */}
          <div
            ref={chatRef}
            className="flex-1 overflow-hidden flex flex-col gap-1.5 px-2 py-2"
            style={{ background: WA_BG }}
          >
            {/* Date chip */}
            <div className="flex justify-center mb-0.5">
              <span
                className="bg-white/75 rounded-full px-2.5 py-0.5 shadow-sm"
                style={{ fontSize: 10, color: '#667781' }}
              >
                Hari ini
              </span>
            </div>

            {MESSAGES.slice(0, visible).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="relative max-w-[86%] shadow-sm px-2.5 py-1.5"
                  style={{
                    background: msg.from === 'user' ? WA_BUBBLE_OUT : '#FFFFFF',
                    fontSize: 12.5,
                    color: '#111B21',
                    borderRadius: msg.from === 'user'
                      ? '8px 2px 8px 8px'
                      : '2px 8px 8px 8px',
                  }}
                >
                  {msg.content}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span style={{ fontSize: 10, color: '#667781' }}>{msg.time}</span>
                    {msg.from === 'user' && (
                      <CheckCheck size={13} style={{ color: '#53BDEB' }} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start">
                <div
                  className="shadow-sm px-3 py-2.5 flex items-center gap-1"
                  style={{ background: '#FFFFFF', borderRadius: '2px 8px 8px 8px' }}
                >
                  {[0, 150, 300].map((d) => (
                    <div
                      key={d}
                      className="rounded-full bg-gray-400 animate-bounce"
                      style={{ width: 6, height: 6, animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div
            className="flex items-center gap-1.5 px-2 py-1.5"
            style={{ background: '#F0F2F5' }}
          >
            <div className="flex-1 flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1.5">
              <Smile size={15} color="#8696A0" />
              <span style={{ fontSize: 11.5, color: '#8696A0', flex: 1 }}>Pesan</span>
              <Paperclip size={13} color="#8696A0" />
            </div>
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 34, height: 34, background: WA_LIGHT_GREEN }}
            >
              <Mic size={15} color="white" />
            </div>
          </div>

          {/* Home indicator */}
          <div
            className="flex justify-center py-1.5"
            style={{ background: '#F0F2F5' }}
          >
            <div className="rounded-full bg-black/20" style={{ width: 80, height: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
