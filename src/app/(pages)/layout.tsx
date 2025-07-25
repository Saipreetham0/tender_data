// src/app/(pages)/layout.tsx
import type { Metadata } from 'next';
// import Link from 'next/link';
// import './legal.css'; // Optional: for extra styles if needed

export const metadata: Metadata = {
  title: 'Legal | TendersNotify.site',
  description: 'Legal policies and disclaimers for TendersNotify.site',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Header */}
      {/* <header className="bg-white border-b shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold text-indigo-700">
            <Link href="/">TendersNotify.site</Link>
          </h1>
          <nav className="space-x-4 text-sm text-gray-600">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refund</Link>
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/cookies">Cookies</Link>
          </nav>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto px-4 py-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} TendersNotify.site. All rights reserved.
      </footer>
    </div>
  );
}
