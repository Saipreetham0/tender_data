// import './globals.css'
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'RGUKT Tenders',
//   description: 'Tender information from various RGUKT campuses',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>{children}</body>
//     </html>
//   )
// }

// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { initDatabase } from '@/lib/db-schema'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RGUKT Tenders',
  description: 'Tender information from various RGUKT campuses',
}

// Initialize database tables on app start (server-side only)
if (typeof window === 'undefined') {
  initDatabase()
    .then(() => console.log('Database initialized'))
    .catch((err) => console.error('Failed to initialize database:', err));
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}