'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const links = [
  { label: 'Home',       href: '/#home' },
  { label: 'About',      href: '/#about' },
  { label: 'Treatments', href: '/#treatments' },
  { label: 'Doctors',    href: '/#doctors' },
  { label: 'Gallery',    href: '/#gallery' },
  { label: 'FAQ',        href: '/#faq' },
  { label: 'Contact',    href: '/#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback?next=/book` },
  })

  const signOut = () => supabase.auth.signOut()

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

        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-sans text-sm tracking-wider text-stone-900 hover:text-brand transition-colors duration-300"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-glass text-xs py-1.5 sm:py-2 px-2 sm:px-3"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
          {mounted && (user ? (
            <div className="flex items-center gap-1 lg:gap-2">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} className="w-5 sm:w-7 h-5 sm:h-7 rounded-full border border-brand/30" alt="" />
              )}
              <span className="font-sans text-xs hidden lg:inline" style={{ color: '#E8621A' }}>Hello, {user.user_metadata?.full_name?.split(' ')[0] || user.email}</span>
              <Link href="/my-bookings" className="btn-glass text-xs py-1.5 sm:py-2 px-2 sm:px-3">My Bookings</Link>
              <button onClick={signOut} className="btn-glass text-xs py-1.5 sm:py-2 px-2 sm:px-3">Sign Out</button>
            </div>
          ) : (
            <Link href="/book" className="btn-glass text-xs py-1.5 sm:py-2 px-3 sm:px-6">Book Now</Link>
          ))}
        </div>

        <button
          className="md:hidden text-stone-600 p-1 flex flex-col gap-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ borderTop: '1px solid rgba(232,98,26,0.2)' }}
            >
              <ul className="px-8 py-4 flex flex-col gap-4">
                {links.map(l => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="font-sans text-sm tracking-wider text-stone-900 hover:text-brand transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/book" onClick={() => setOpen(false)} className="btn-glass inline-block text-xs py-2 px-6">
                    Book Now
                  </Link>
                </li>
                {mounted && (user ? (
                  <>
                    <li><Link href="/book" onClick={() => setOpen(false)} className="btn-glass inline-block text-xs py-2 px-6">My Bookings</Link></li>
                    <li><button onClick={signOut} className="btn-glass text-xs py-2 px-6">Sign Out</button></li>
                  </>
                ) : (
                  <li><button onClick={signIn} className="btn-glass text-xs py-2 px-6 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Sign in with Google
                  </button></li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  )
}
