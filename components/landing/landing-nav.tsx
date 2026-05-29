import { Menu, X, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LandingNavProps {
  isDark: boolean
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  toggleTheme: () => void
  dashboardHref: string
  dashboardLabel: string
}

export function LandingNav({ isDark, isMenuOpen, setIsMenuOpen, toggleTheme, dashboardHref, dashboardLabel }: LandingNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
              <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-amber-400 rounded-full" />
            </div>
            <span className="font-bold text-xl hidden sm:inline">WebiBudgets</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href={dashboardHref} className="text-sm font-medium hover:text-amber-500 transition">{dashboardLabel}</a>
            <a href="#features" className="text-sm font-medium hover:text-amber-500 transition">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-amber-500 transition">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-amber-500 transition">Testimonials</a>
            <a href="#faq" className="text-sm font-medium hover:text-amber-500 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={dashboardHref}>{dashboardLabel}</Link>
            </Button>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-4 space-y-2">
            <a href={dashboardHref} className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">{dashboardLabel}</a>
            <a href="#features" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Features</a>
            <a href="#pricing" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Pricing</a>
            <a href="#testimonials" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Testimonials</a>
            <a href="#faq" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">FAQ</a>
            <Button asChild size="sm" className="w-full">
              <Link href={dashboardHref}>{dashboardLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
