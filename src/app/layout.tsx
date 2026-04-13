import type { Metadata } from 'next'
import './globals.css'
import HelpModal from '@/components/HelpModal'

export const metadata: Metadata = {
  title: 'Quiz Night',
  description: 'A responsive, modern Next.js trivia app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <HelpModal />
      </body>
    </html>
  )
}

