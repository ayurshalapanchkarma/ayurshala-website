import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function AdminBackButton({ dark }: { dark: boolean }) {
  return (
    <Link href="/admin" className={`flex items-center gap-1 text-sm font-medium transition mb-6 w-fit ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
      <ChevronLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  )
}
