import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { LanguageProvider } from '@/components/providers/language-provider'
import { DEFAULT_LOCALE, isLocale } from '@/lib/locale'
  import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Admin panel to manage leads and users.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const rawLocale = await getLocale()
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE

  return (
    <html lang={locale} className="bg-background">
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
