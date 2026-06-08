import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ayurshala — Ayurveda & Panchakarma Center, Noida',
  description: 'Authentic Panchakarma therapies in Noida. Shirodhara, Abhyanga, Kati Basti, Nasya and 19 more treatments by certified Ayurvedic physicians. Book an appointment today.',
  keywords: 'Panchakarma Noida, Ayurveda Noida, Shirodhara, Abhyanga, Kati Basti, Ayurshala, Ayurvedic treatment Noida, Sector 130 Noida',
  openGraph: {
    title: 'Ayurshala — Ayurveda & Panchakarma Center, Noida',
    description: 'Authentic Panchakarma therapies in Noida. 500+ patients treated. Book your appointment today.',
    url: 'https://www.ayurshalapanchakarma.com',
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
        {/* Google Analytics */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-JDJFTB5DDK" />
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-JDJFTB5DDK');`}
        </Script>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
