import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand:  '#E8621A',   // primary orange (logo color)
        amber:  '#F5A623',   // warm amber accent
        teal:   '#0D9488',   // teal accent
        rose:   '#E11D48',   // rose accent
        cream:  '#fdf6ee',
        dark:   '#0e0a06',
      },
      fontFamily: {
        serif: ['Marcellus', 'Georgia', 'serif'],
        sans:  ['Marcellus', 'Georgia', 'serif'],
      },
      animation: {
        blob1: 'blob1 18s ease-in-out infinite',
        blob2: 'blob2 22s ease-in-out infinite',
        blob3: 'blob3 26s ease-in-out infinite',
        blob4: 'blob4 20s ease-in-out infinite',
      },
      keyframes: {
        blob1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(60px,-40px) scale(1.15)' },
          '66%':     { transform: 'translate(-40px,30px) scale(0.9)' },
        },
        blob2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(-70px,50px) scale(1.1)' },
          '66%':     { transform: 'translate(50px,-60px) scale(0.95)' },
        },
        blob3: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(40px,70px) scale(0.9)' },
          '66%':     { transform: 'translate(-60px,-30px) scale(1.2)' },
        },
        blob4: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-50px,60px) scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
