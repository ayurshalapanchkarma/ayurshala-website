import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from './providers'
import { getBaseUrl } from '@/lib/url'
import './globals.css'

const baseUrl = getBaseUrl()

export const metadata: Metadata = {
  title: 'Ayurshala Panchakarma Center | Secure Patient Portal',
  description: 'Official website of Ayurshala Panchakarma Center. Book appointments, access treatment records, download medical certificates, and securely manage your healthcare using Google Sign-In.',
  keywords: 'Panchakarma, Ayurveda, Patient Portal, Medical Certificates, Appointments, Healthcare',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'Ayurshala Panchakarma Center | Secure Patient Portal',
    description: 'Book appointments, access treatment records, and manage your healthcare securely.',
    url: baseUrl,
    siteName: 'Ayurshala Panchakarma Center',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/ayurshala.png" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-JDJFTB5DDK" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            try {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JDJFTB5DDK', {
                'anonymize_ip': true
              });
            } catch (error) {
              // Silently fail analytics, don't break page
            }
          `}
        </Script>
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
