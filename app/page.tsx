import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import About from '@/components/About'
import Treatments from '@/components/Treatments'
import Conditions from '@/components/Conditions'
import Doctors from '@/components/Doctors'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import WhatsAppButton from '@/components/WhatsAppButton'
import GlassBackground from '@/components/GlassBackground'

export default function Home() {
  return (
    <main>
      <GlassBackground />
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Treatments />
      <Conditions />
      <Doctors />
      <Gallery />
      <Testimonials />
      <FAQ />
      <Contact />
      <WhatsAppButton />
    </main>
  )
}
