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
    description: 'Authentic Panchakarma therapies in Noida. 3000+ patients treated. Book your appointment today.',
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
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22 width=%2232%22 height=%2232%22><rect width=%2264%22 height=%2264%22 fill=%22%23E8621A%22 rx=%2214%22/><path d=%22M24 16h16v2s0 4-4 6v4c4 4 6 8 6 12 0 6-5 10-10 10s-10-4-10-10c0-4 2-8 6-12v-4c-4-2-4-6-4-6v-2zm8 32c1 0 2 2 2 4s-1 3-2 3-2-1-2-3 1-4 2-4z%22 fill=%22%23FFFFFF%22/></svg>" />
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
