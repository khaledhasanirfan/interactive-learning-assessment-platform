import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/layout/Navbar';

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
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-sky-50/60 via-slate-50 to-emerald-50/40 text-slate-900 font-sans antialiased selection:bg-sky-200 selection:text-sky-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="bg-white/80 backdrop-blur-xs border-t border-sky-100/60 py-4 text-center text-xs text-slate-500">
            <div className="w-full px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-medium text-slate-600">
                <span>⚡</span>
                <span>KernelBuddy &bull; CSE-307 Operating Systems</span>
              </p>
              <p className="text-slate-400">
                Designed for Interactive Learning &bull; University Assessment Platform
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
