import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { KernelBuddyCompanion } from '@/components/mascot/KernelBuddyCompanion';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KernelBuddy — Interactive OS Learning Platform',
  description: 'Master Operating Systems interactively with visual simulations and smart assessments.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col mint-animated-bg text-slate-900 antialiased selection:bg-emerald-200 selection:text-emerald-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
          <KernelBuddyCompanion />
          <footer className="bg-white/85 backdrop-blur-md border-t border-emerald-100 py-4 text-center text-xs text-slate-600">
            <div className="w-full px-4 flex items-center justify-center text-center">
              <p className="font-semibold text-emerald-900/90 text-xs sm:text-sm">
                designed and developed by <span className="font-bold text-emerald-700">@khaledirfan</span>. all rights reserved 2026 copyright
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

