import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'Encrypted Storage - Zero-Knowledge Cloud Storage',
  description: 'Secure, private cloud storage with client-side encryption. Your files, your keys.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}