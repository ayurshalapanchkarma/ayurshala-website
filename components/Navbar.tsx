'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { createClient } from '@supabase/supabase-js'
import { Menu, X, ShieldCheck, LogOut, LayoutDashboard, CalendarPlus, ChevronDown } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const publicLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Treatments', href: '/#treatments' },
  { label: 'Doctors', href: '/#doctors' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 pt-2 sm:pt-6 pointer-events-none overflow-hidden">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full mx-auto rounded-2xl sm:rounded-3xl transition-all duration-300 pointer-events-auto"
        style={{
          background: mounted && theme === 'dark'
            ? 'rgba(15,26,18,0.08)'
            : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          border: '1px solid rgba(232,98,26,0.18)',
          boxShadow: '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-3 sm:px-6 md:px-8 flex items-center justify-between h-14 sm:h-16 md:h-20">
          <Link href="/" className="flex items-center h-full py-1 sm:py-2">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala"
              width={260}
              height={80}
              className="object-contain h-full w-auto max-w-[120px] sm:max-w-[180px]"
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-8">
            {publicLinks.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="font-sans text-sm tracking-wider text-stone-900 hover:text-orange-600 transition-colors duration-300"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && mounted && (
              <>
                {!user ? (
                  <>
                    <Link
                      href="/book-appointment"
                      className="btn-glass text-xs py-2 px-4 flex items-center gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      <span>Book</span>
                    </Link>
                    <Link
                      href="/admin/login"
                      className="btn-glass text-xs py-2 px-4 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  </>
                ) : profile?.role === 'ADMIN' ? (
                  <>
                    <Link href="/admin" className="btn-glass text-xs py-2 px-4">
                      Admin Console
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="btn-glass text-xs py-2 px-4 flex items-center gap-2"
                      >
                        <span className="truncate max-w-[150px]">{user.email}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-stone-200 overflow-hidden z-50"
                          >
                            <Link href="/admin" className="block px-4 py-2 hover:bg-orange-50 text-sm text-stone-900">
                              Dashboard
                            </Link>
                            <Link href="/admin" className="block px-4 py-2 hover:bg-orange-50 text-sm text-stone-900">
                              Refunds
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/patient/dashboard" className="btn-glass text-xs py-2 px-4">
                      My Dashboard
                    </Link>
                    <Link
                      href="/book-appointment"
                      className="btn-glass text-xs py-2 px-4 flex items-center gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="btn-glass text-xs py-2 px-4 flex items-center gap-2"
                      >
                        <span className="truncate max-w-[150px]">{user.email}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-stone-200 overflow-hidden z-50"
                          >
                            <Link href="/patient/bookings" className="block px-4 py-2 hover:bg-orange-50 text-sm text-stone-900">
                              My Bookings
                            </Link>
                            <Link href="/patient/dashboard" className="block px-4 py-2 hover:bg-orange-50 text-sm text-stone-900">
                              Profile
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-stone-600 p-1"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ borderTop: '1px solid rgba(232,98,26,0.2)' }}
            >
              <ul className="px-4 py-4 flex flex-col gap-3">
                {publicLinks.map(l => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="font-sans text-sm text-stone-900 hover:text-orange-600"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                {!loading && mounted && !user && (
                  <>
                    <li>
                      <Link
                        href="/book-appointment"
                        onClick={() => setOpen(false)}
                        className="btn-glass block text-xs py-2 px-4 text-center"
                      >
                        Book Appointment
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/login"
                        onClick={() => setOpen(false)}
                        className="btn-glass block text-xs py-2 px-4 text-center"
                      >
                        Admin Login
                      </Link>
                    </li>
                  </>
                )}
                {!loading && mounted && user && (
                  <>
                    {profile?.role === 'ADMIN' ? (
                      <>
                        <li>
                          <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                            className="btn-glass block text-xs py-2 px-4 text-center"
                          >
                            Admin Console
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={() => { handleSignOut(); setOpen(false); }}
                            className="btn-glass block w-full text-xs py-2 px-4 text-center text-red-600"
                          >
                            Logout
                          </button>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link
                            href="/patient/dashboard"
                            onClick={() => setOpen(false)}
                            className="btn-glass block text-xs py-2 px-4 text-center"
                          >
                            My Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/book-appointment"
                            onClick={() => setOpen(false)}
                            className="btn-glass block text-xs py-2 px-4 text-center"
                          >
                            Book Appointment
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={() => { handleSignOut(); setOpen(false); }}
                            className="btn-glass block w-full text-xs py-2 px-4 text-center text-red-600"
                          >
                            Logout
                          </button>
                        </li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  )
}
