import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Interactive Learning & Assessment Platform',
  description: 'Undergraduate Computer Science interactive assessment and simulation platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>CSE-307: Operating System &mdash; Interactive Assessment Platform</p>
              <p>Designed for Computer Science Education &bull; Zero Untracked Data &bull; WCAG Accessible</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
