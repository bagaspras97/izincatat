import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://izincatat.com'),
  title: {
    default: 'Izin Catat — Catat Keuangan Lewat WhatsApp',
    template: '%s | Izin Catat',
  },
  description: 'Bot WhatsApp pencatat keuangan pribadi. Kirim pesan, langsung tercatat. Lihat laporan, grafik, dan analisis pengeluaran dari dashboard kapan saja.',
  keywords: [
    'catat keuangan whatsapp',
    'bot keuangan whatsapp',
    'aplikasi keuangan pribadi',
    'pencatatan keuangan otomatis',
    'laporan keuangan harian',
    'keuangan pasangan',
    'catat pengeluaran',
  ],
  authors: [{ name: 'Izin Catat', url: 'https://izincatat.com' }],
  creator: 'Izin Catat',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://izincatat.com',
    siteName: 'Izin Catat',
    title: 'Izin Catat — Catat Keuangan Lewat WhatsApp',
    description: 'Bot WhatsApp pencatat keuangan pribadi. Kirim pesan, langsung tercatat. Lihat laporan dan analisis pengeluaran dari dashboard kapan saja.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Izin Catat — Catat Keuangan Lewat WhatsApp',
    description: 'Bot WhatsApp pencatat keuangan pribadi. Kirim pesan, langsung tercatat.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  other: {
    'facebook-domain-verification': 'e7d6oOq4lm02gw7l5e8xig6knoomtl',
    'google-site-verification': 'qiK0s2vwIU8rCZN6rwnlLRFOB3cihYUI5FrTKa7EX18',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Cegah flash of unstyled content — baca theme dari localStorage sebelum paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
