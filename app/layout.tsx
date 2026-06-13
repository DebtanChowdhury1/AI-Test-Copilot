import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AI Test Copilot',
  description: 'Generate professional test cases from user stories using AI',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans`}>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(9,12,28,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                backdropFilter: 'blur(20px)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
