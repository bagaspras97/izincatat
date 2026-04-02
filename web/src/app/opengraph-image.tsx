import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Izin Catat — Catat Keuangan Lewat WhatsApp';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#111110',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(126,200,67,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '200px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(126,200,67,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Logo + nama */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          {/* Chat bubble icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(126,200,67,0.15)',
              border: '1px solid rgba(126,200,67,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 512 512" fill="none">
              <g transform="translate(-6, 34)">
                <path
                  d="M134 162 C134 130 160 104 192 104 L332 104 C364 104 390 130 390 162 L390 282 C390 314 364 340 332 340 L240 340 L186 388 L198 340 L192 340 C160 340 134 314 134 282 Z"
                  fill="#4A7A2E"
                />
                <polyline
                  points="190,222 235,267 336,166"
                  stroke="#7EC843"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>
          <span style={{ color: '#A8A59E', fontSize: '22px', fontWeight: 600, letterSpacing: '0.02em' }}>
            izincatat.com
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#F0EDE6',
            lineHeight: 1.1,
            marginBottom: '24px',
            maxWidth: '800px',
          }}
        >
          Catat Keuangan{' '}
          <span style={{ color: '#7EC843' }}>Lewat WhatsApp</span>
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: '24px',
            color: '#6B6963',
            maxWidth: '680px',
            lineHeight: 1.5,
            marginBottom: '48px',
          }}
        >
          Kirim pesan, bot langsung catat. Lihat laporan kapan saja dari dashboard.
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Gratis', 'Tanpa install app', 'Voice note support'].map((text) => (
            <div
              key={text}
              style={{
                padding: '10px 20px',
                borderRadius: '9999px',
                border: '1px solid #303030',
                background: '#1A1A18',
                color: '#A8A59E',
                fontSize: '16px',
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
