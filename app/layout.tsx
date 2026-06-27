import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ayurshala — Panchakarma ERP Platform',
  description: 'Ayurshala Panchakarma ERP - Modern healthcare platform for clinics',
  keywords: 'Panchakarma, Ayurveda, ERP, Healthcare',
  openGraph: {
    title: 'Ayurshala — Panchakarma ERP Platform',
    description: 'Ayurshala Panchakarma ERP - Modern healthcare platform for clinics',
    url: 'https://app.ayurshalapanchakarma.com',
    siteName: 'Ayurshala',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/ayurshala.png" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-JDJFTB5DDK" />
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-JDJFTB5DDK');`}
        </Script>
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
