'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

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
  useEffect(() => setMounted(true), [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-6 pointer-events-none">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-6xl mx-auto rounded-3xl transition-all duration-300 pointer-events-auto"
        style={{
          background: mounted && theme === 'dark' 
            ? 'rgba(15,26,18,0.15)' 
            : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,98,26,0.15)',
        }}
      >
        <div className="px-8 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center h-full py-2">
          <Image
            src="/ayurshala_text_transparent.png"
            alt="Ayurshala"
            width={260}
            height={80}
            className="object-contain h-full w-auto"
            priority
          />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-sans text-sm tracking-wider text-stone-500 hover:text-brand transition-colors duration-300"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-glass text-xs py-2 px-3"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
          <Link href="/book" className="btn-glass text-xs py-2 px-6">
            Book Now
          </Link>
        </div>

        <button
          className="md:hidden text-stone-600 p-2 flex flex-col gap-1.5"
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
                      className="font-sans text-sm tracking-wider text-stone-500 hover:text-brand transition-colors"
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
                {mounted && (
                  <li>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="btn-glass text-xs py-2 px-6"
                    >
                      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  )
}
