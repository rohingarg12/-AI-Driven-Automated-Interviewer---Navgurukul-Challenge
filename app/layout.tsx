import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Project Interviewer | Navgurukul',
  description: 'AI-Driven Automated Interviewer for Project Presentations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5" />
        <main className="relative z-10">
          {children}
        </main>
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
