import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'بوابة النتائج | Alexandria Elite Academy',
  description: 'Student results portal for Alexandria Elite Academy — استعلام عن النتائج الدراسية',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // dir and lang are controlled client-side via LanguageProvider
    <html suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  )
}
